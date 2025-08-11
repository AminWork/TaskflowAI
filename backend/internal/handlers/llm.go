package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"kanban-backend/internal/database"
	"kanban-backend/internal/models"
)

// UpdateLLMConfig updates the LLM configuration for a board
func UpdateLLMConfig(c *gin.Context) {
	boardID := c.Param("id")
	userID := c.GetUint("user_id")

	var req struct {
		Provider string `json:"provider" binding:"required,oneof=openai openrouter"`
		APIKey   string `json:"api_key"`
		Model    string `json:"model" binding:"required"`
		Enabled  bool   `json:"enabled"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user is board owner
	var member models.BoardMember
	if err := database.DB.Where("board_id = ? AND user_id = ? AND role = ?", boardID, userID, "owner").First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only board owners can configure LLM settings"})
		return
	}

	// Update or create board settings
	var settings models.BoardSettings
	if err := database.DB.Where("board_id = ?", boardID).First(&settings).Error; err != nil {
		// Create new settings
		if strings.TrimSpace(req.APIKey) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "API key is required when configuring LLM for the first time"})
			return
		}
		settings = models.BoardSettings{
			BoardID:     member.BoardID,
			LLMProvider: req.Provider,
			LLMAPIKey:   req.APIKey,
			LLMModel:    req.Model,
			LLMEnabled:  req.Enabled,
		}
		if err := database.DB.Create(&settings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create LLM settings"})
			return
		}
	} else {
		// Update existing settings
		settings.LLMProvider = req.Provider
		if strings.TrimSpace(req.APIKey) != "" {
			settings.LLMAPIKey = req.APIKey
		}
		settings.LLMModel = req.Model
		settings.LLMEnabled = req.Enabled
		if err := database.DB.Save(&settings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update LLM settings"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "LLM configuration updated successfully"})
}

// GetLLMConfig retrieves the LLM configuration for a board
func GetLLMConfig(c *gin.Context) {
	boardID := c.Param("id")
	userID := c.GetUint("user_id")

	// Check if user is a board member
	var member models.BoardMember
	if err := database.DB.Where("board_id = ? AND user_id = ?", boardID, userID).First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var settings models.BoardSettings
	if err := database.DB.Where("board_id = ?", boardID).First(&settings).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{
			"provider": "",
			"model":    "",
			"enabled":  false,
		})
		return
	}

	// Don't send the API key to non-owners
	response := gin.H{
		"provider": settings.LLMProvider,
		"model":    settings.LLMModel,
		"enabled":  settings.LLMEnabled,
	}

	if member.Role == "owner" {
		response["has_api_key"] = settings.LLMAPIKey != ""
	}

	c.JSON(http.StatusOK, response)
}

// ProviderModel represents a normalized provider model entry
type ProviderModel struct {
	ID   string `json:"id"`
	Name string `json:"name,omitempty"`
}

// SearchLLMModels returns models for a provider, optionally filtered by a search query.
// Owners may omit api_key to use the stored board key. Non-owners must provide api_key.
func SearchLLMModels(c *gin.Context) {
	boardID := c.Param("id")
	userID := c.GetUint("user_id")

	// Check membership
	var member models.BoardMember
	if err := database.DB.Where("board_id = ? AND user_id = ?", boardID, userID).First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var req struct {
		Provider string `json:"provider" binding:"required,oneof=openai openrouter"`
		APIKey   string `json:"api_key"`
		Query    string `json:"query"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Determine API key to use
	apiKey := req.APIKey

	if apiKey == "" {
		// Allow owners to use stored key without sending it over the wire
		var settings models.BoardSettings
		if err := database.DB.Where("board_id = ?", boardID).First(&settings).Error; err == nil {
			if member.Role == "owner" && settings.LLMProvider == req.Provider && settings.LLMAPIKey != "" {
				apiKey = settings.LLMAPIKey
			}
		}
	}

	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "API key is required to list models"})
		return
	}

	// Fetch models from provider
	var (
		modelsResp []ProviderModel
		err        error
	)

	switch req.Provider {
	case "openai":
		modelsResp, err = listOpenAIModels(apiKey)
	case "openrouter":
		modelsResp, err = listOpenRouterModels(apiKey)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported provider"})
		return
	}

	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": fmt.Sprintf("Failed to fetch models: %v", err)})
		return
	}

	// Filter by query (case-insensitive substring on id or name)
	q := strings.ToLower(strings.TrimSpace(req.Query))
	result := make([]string, 0, len(modelsResp))
	for _, m := range modelsResp {
		if q == "" || strings.Contains(strings.ToLower(m.ID), q) || strings.Contains(strings.ToLower(m.Name), q) {
			result = append(result, m.ID)
		}
	}

	c.JSON(http.StatusOK, gin.H{"models": result})
}

// listOpenAIModels fetches available models from OpenAI
func listOpenAIModels(apiKey string) ([]ProviderModel, error) {
	url := "https://api.openai.com/v1/models"

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OpenAI models API error: %s", string(body))
	}

	var parsed struct {
		Data []struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, err
	}

	out := make([]ProviderModel, 0, len(parsed.Data))
	for _, d := range parsed.Data {
		if d.ID != "" {
			out = append(out, ProviderModel{ID: d.ID})
		}
	}
	return out, nil
}

// listOpenRouterModels fetches available models from OpenRouter
func listOpenRouterModels(apiKey string) ([]ProviderModel, error) {
	url := "https://openrouter.ai/api/v1/models"

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	// Authorization is recommended by OpenRouter; include if provided
	if strings.TrimSpace(apiKey) != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))
	}
	req.Header.Set("HTTP-Referer", "https://taskflow.ai")
	req.Header.Set("X-Title", "TaskFlow AI")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OpenRouter models API error: %s", string(body))
	}

	var parsed struct {
		Data []struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, err
	}

	out := make([]ProviderModel, 0, len(parsed.Data))
	for _, d := range parsed.Data {
		if d.ID != "" {
			out = append(out, ProviderModel{ID: d.ID, Name: d.Name})
		}
	}
	return out, nil
}

// GenerateTasks uses LLM to generate tasks based on project description and member capabilities
func GenerateTasks(c *gin.Context) {
	boardID := c.Param("id")
	userID := c.GetUint("user_id")

	// Check if user is board owner or admin
	var member models.BoardMember
	if err := database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", boardID, userID, []string{"owner", "admin"}).First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only board owners and admins can generate tasks"})
		return
	}

	// Get board details
	var board models.Board
	if err := database.DB.First(&board, boardID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Board not found"})
		return
	}

	// Get LLM settings
	var settings models.BoardSettings
	if err := database.DB.Where("board_id = ?", boardID).First(&settings).Error; err != nil || !settings.LLMEnabled {
		c.JSON(http.StatusBadRequest, gin.H{"error": "LLM is not configured for this board"})
		return
	}

	// Get all board members with their profiles
	var members []models.BoardMember
	if err := database.DB.Preload("User").Where("board_id = ?", boardID).Find(&members).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch board members"})
		return
	}

	// Get member profiles
	var profiles []models.MemberProfile
	userIDs := make([]uint, len(members))
	for i, m := range members {
		userIDs[i] = m.UserID
	}
	database.DB.Where("user_id IN ?", userIDs).Find(&profiles)

	// Create a map of user profiles
	profileMap := make(map[uint]models.MemberProfile)
	for _, p := range profiles {
		profileMap[p.UserID] = p
	}

	// Prepare the prompt for LLM
	prompt := buildTaskGenerationPrompt(board, members, profileMap)

	// Call LLM API
	tasks, err := callLLMAPI(settings, prompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to generate tasks: %v", err)})
		return
	}

    // Helper: normalize priority to one of: low, medium, high
    normalizePriority := func(p string) string {
        p = strings.ToLower(strings.TrimSpace(p))
        switch p {
        case "low", "medium", "high":
            return p
        default:
            return "medium"
        }
    }

    // Helper: slugify category into a status key used by columns
    slugify := func(s string) string {
        s = strings.ToLower(strings.TrimSpace(s))
        s = strings.ReplaceAll(s, " ", "-")
        // keep only a-z, 0-9 and '-'
        var b strings.Builder
        for _, r := range s {
            if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
                b.WriteRune(r)
            }
        }
        out := b.String()
        if out == "" {
            out = "todo"
        }
        return out
    }

    // Begin transaction to create missing columns and tasks atomically
    tx := database.DB.Begin()
    defer func() {
        if r := recover(); r != nil {
            tx.Rollback()
        }
    }()

    // Load existing columns for the board
    var existingCols []models.Column
    if err := tx.Where("board_id = ?", board.ID).Find(&existingCols).Error; err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch columns"})
        return
    }
    statusToCol := make(map[string]models.Column)
    maxPos := 0
    for _, col := range existingCols {
        statusToCol[col.Status] = col
        if col.Position > maxPos {
            maxPos = col.Position
        }
    }

    // Determine categories from tasks and ensure columns exist
    type catInfo struct{ title, status string }
    categories := make(map[string]catInfo) // key: status
    for _, td := range tasks {
        cat := strings.TrimSpace(td.Category)
        if cat == "" {
            cat = "To Do"
        }
        status := slugify(cat)
        if _, ok := categories[status]; !ok {
            // Title-case first letter for display
            title := cat
            if len(title) > 0 {
                title = strings.ToUpper(title[:1]) + title[1:]
            }
            categories[status] = catInfo{title: title, status: status}
        }
    }

    for _, ci := range categories {
        if _, exists := statusToCol[ci.status]; !exists {
            maxPos++
            newCol := models.Column{
                BoardID:  board.ID,
                Title:    ci.title,
                Status:   ci.status,
                Position: maxPos,
            }
            if err := tx.Create(&newCol).Error; err != nil {
                tx.Rollback()
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create columns"})
                return
            }
            statusToCol[ci.status] = newCol
        }
    }

    // Create tasks with status mapped to their category's slug/column
    createdTasks := []models.Task{}
    for _, taskData := range tasks {
        category := strings.TrimSpace(taskData.Category)
        if category == "" {
            category = "To Do"
        }
        status := slugify(category)

        task := models.Task{
            Title:       taskData.Title,
            Description: taskData.Description,
            Priority:    normalizePriority(taskData.Priority),
            Category:    category,
            Status:      status,
            BoardID:     board.ID,
            CreatedBy:   userID,
        }

        // Find assignee by exact name or email (case-insensitive)
        if taskData.AssigneeName != "" {
            for _, m := range members {
                if strings.EqualFold(m.User.Name, taskData.AssigneeName) || strings.EqualFold(m.User.Email, taskData.AssigneeName) {
                    task.AssigneeID = &m.UserID
                    break
                }
            }
        }

        if err := tx.Create(&task).Error; err != nil {
            tx.Rollback()
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create generated tasks"})
            return
        }
        createdTasks = append(createdTasks, task)
    }

    if err := tx.Commit().Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to finalize task generation"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": fmt.Sprintf("Generated %d tasks successfully", len(createdTasks)),
        "tasks":   createdTasks,
    })
}

func buildTaskGenerationPrompt(board models.Board, members []models.BoardMember, profiles map[uint]models.MemberProfile) string {
    var prompt strings.Builder
    
    prompt.WriteString("You are a project manager assistant. Based on the following project information, generate a list of tasks.\n\n")
    prompt.WriteString(fmt.Sprintf("Project: %s\n", board.Title))
    prompt.WriteString(fmt.Sprintf("Description: %s\n\n", board.Description))
    
    prompt.WriteString("Team Members:\n")
    for _, member := range members {
        prompt.WriteString(fmt.Sprintf("- %s (%s) - Role: %s\n", member.User.Name, member.User.Email, member.Role))
        if profile, ok := profiles[member.UserID]; ok {
            if profile.Skills != "" {
                prompt.WriteString(fmt.Sprintf("  Skills: %s\n", profile.Skills))
            }
            if profile.Capabilities != "" {
                prompt.WriteString(fmt.Sprintf("  Experience: %s\n", profile.Capabilities))
            }
            if profile.ResumeText != "" && len(profile.ResumeText) > 0 {
                // Include a summary of resume (first 200 chars)
                resumeSummary := profile.ResumeText
                if len(resumeSummary) > 200 {
                    resumeSummary = resumeSummary[:200] + "..."
                }
                prompt.WriteString(fmt.Sprintf("  Resume Summary: %s\n", resumeSummary))
            }
        }
    }
    
    prompt.WriteString("\nGenerate a list of tasks for this project. Each task should include:\n")
    prompt.WriteString("- Title (clear and concise)\n")
    prompt.WriteString("- Description (detailed explanation)\n")
    prompt.WriteString("- Priority (low, medium, or high)\n")
    prompt.WriteString("- Category (e.g., frontend, backend, design, testing, documentation)\n")
    prompt.WriteString("- Suggested assignee (use the team member's name based on their skills and experience)\n")
    // Important: categories become board columns if missing; keep them short and consistent.
    prompt.WriteString("\nNotes:\n")
    prompt.WriteString("- Category will be used to create a column if it doesn't exist.\n")
    prompt.WriteString("- Use short, lowercase categories like: frontend, backend, design, testing, documentation, devops, research.\n")
    prompt.WriteString("- Priority must be one of: low, medium, high.\n")
    prompt.WriteString("- For assignee_name, prefer an exact member name or email from the team list above.\n")
    prompt.WriteString("\nReturn the tasks as a JSON array with the following structure:\n")
    prompt.WriteString(`[{"title": "...", "description": "...", "priority": "...", "category": "...", "assignee_name": "..."}]`)
    
    return prompt.String()
}

type GeneratedTask struct {
	Title        string `json:"title"`
	Description  string `json:"description"`
	Priority     string `json:"priority"`
	Category     string `json:"category"`
	AssigneeName string `json:"assignee_name"`
}

func callLLMAPI(settings models.BoardSettings, prompt string) ([]GeneratedTask, error) {
	var tasks []GeneratedTask
	
	switch settings.LLMProvider {
	case "openai":
		return callOpenAI(settings, prompt)
	case "openrouter":
		return callOpenRouter(settings, prompt)
	default:
		return tasks, fmt.Errorf("unsupported LLM provider: %s", settings.LLMProvider)
	}
}

func callOpenAI(settings models.BoardSettings, prompt string) ([]GeneratedTask, error) {
	url := "https://api.openai.com/v1/chat/completions"
	
	requestBody := map[string]interface{}{
		"model": settings.LLMModel,
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "You are a helpful project management assistant that generates tasks based on project requirements.",
			},
			{
				"role":    "user",
				"content": prompt,
			},
		},
		"temperature": 0.7,
		"max_tokens":  2000,
	}
	
	jsonBody, _ := json.Marshal(requestBody)
	
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", settings.LLMAPIKey))
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OpenAI API error: %s", string(body))
	}
	
	var response struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}
	
	if len(response.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}
	
	// Parse the JSON response from the LLM
	var tasks []GeneratedTask
	content := response.Choices[0].Message.Content
	
	// Try to extract JSON from the response
	startIdx := strings.Index(content, "[")
	endIdx := strings.LastIndex(content, "]")
	if startIdx != -1 && endIdx != -1 && endIdx > startIdx {
		jsonStr := content[startIdx : endIdx+1]
		if err := json.Unmarshal([]byte(jsonStr), &tasks); err != nil {
			return nil, fmt.Errorf("failed to parse tasks from LLM response: %v", err)
		}
	}
	
	return tasks, nil
}

func callOpenRouter(settings models.BoardSettings, prompt string) ([]GeneratedTask, error) {
	url := "https://openrouter.ai/api/v1/chat/completions"
	
	requestBody := map[string]interface{}{
		"model": settings.LLMModel,
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "You are a helpful project management assistant that generates tasks based on project requirements.",
			},
			{
				"role":    "user",
				"content": prompt,
			},
		},
		"temperature": 0.7,
		"max_tokens":  2000,
	}
	
	jsonBody, _ := json.Marshal(requestBody)
	
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", settings.LLMAPIKey))
	req.Header.Set("HTTP-Referer", "https://taskflow.ai")
	req.Header.Set("X-Title", "TaskFlow AI")
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OpenRouter API error: %s", string(body))
	}
	
	var response struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}
	
	if len(response.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenRouter")
	}
	
	// Parse the JSON response from the LLM
	var tasks []GeneratedTask
	content := response.Choices[0].Message.Content
	
	// Try to extract JSON from the response
	startIdx := strings.Index(content, "[")
	endIdx := strings.LastIndex(content, "]")
	if startIdx != -1 && endIdx != -1 && endIdx > startIdx {
		jsonStr := content[startIdx : endIdx+1]
		if err := json.Unmarshal([]byte(jsonStr), &tasks); err != nil {
			return nil, fmt.Errorf("failed to parse tasks from LLM response: %v", err)
		}
	}
	
	return tasks, nil
}

// UpdateMemberProfile updates a user's profile/resume information
func UpdateMemberProfile(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	var req struct {
		Resume     string `json:"resume"`
		Skills     string `json:"skills"`
		Experience string `json:"experience"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	var profile models.MemberProfile
	if err := database.DB.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		// Create new profile
		profile = models.MemberProfile{
			UserID:     userID,
			ResumeText: req.Resume,
			Skills:     req.Skills,
			Capabilities: req.Experience,
		}
		if err := database.DB.Create(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create profile"})
			return
		}
	} else {
		// Update existing profile
		profile.ResumeText = req.Resume
		profile.Skills = req.Skills
		profile.Capabilities = req.Experience
		if err := database.DB.Save(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
			return
		}
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully", "profile": profile})
}

// GetMemberProfile retrieves a user's profile/resume information
func GetMemberProfile(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	var profile models.MemberProfile
	if err := database.DB.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		// Return empty profile if not found
		c.JSON(http.StatusOK, gin.H{
			"resume":     "",
			"skills":     "",
			"experience": "",
			"resume_file": "",
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"resume":     profile.ResumeText,
		"skills":     profile.Skills,
		"experience": profile.Capabilities,
		"resume_file": profile.ResumeFile,
	})
}

// UploadResumeFile handles resume file uploads
func UploadResumeFile(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	// Get the uploaded file
	file, err := c.FormFile("resume")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	
	// Validate file type
	allowedTypes := map[string]bool{
		"application/pdf":                                                     true,
		"application/msword":                                                  true,
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
		"text/plain":                                                          true,
	}
	
	if !allowedTypes[file.Header.Get("Content-Type")] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed"})
		return
	}
	
	// Validate file size (5MB limit)
	if file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size must be less than 5MB"})
		return
	}
	
	// Create uploads directory if it doesn't exist
	uploadsDir := "/app/uploads/resumes"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}
	
	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("resume_%d_%d%s", userID, time.Now().Unix(), ext)
	filePath := filepath.Join(uploadsDir, filename)
	
	// Save the file
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	
	// Update or create profile with file information
	var profile models.MemberProfile
	if err := database.DB.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		// Create new profile
		profile = models.MemberProfile{
			UserID:     userID,
			ResumeFile: fmt.Sprintf("/uploads/resumes/%s", filename),
		}
		if err := database.DB.Create(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create profile"})
			return
		}
	} else {
		// Update existing profile
		// Remove old file if it exists
		if profile.ResumeFile != "" {
			// Stored as URL path like /uploads/resumes/filename
			relPath := strings.TrimPrefix(profile.ResumeFile, "/")
			oldFilePath := filepath.Join("/app", relPath)
			os.Remove(oldFilePath) // Ignore error if file doesn't exist
		}
		
		profile.ResumeFile = fmt.Sprintf("/uploads/resumes/%s", filename)
		if err := database.DB.Save(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
			return
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message":  "Resume file uploaded successfully",
		"filename": filename,
		"url":      fmt.Sprintf("/uploads/resumes/%s", filename),
	})
}

// DeleteResumeFile removes the user's stored resume file and clears the DB field
func DeleteResumeFile(c *gin.Context) {
    userID := c.GetUint("user_id")

    var profile models.MemberProfile
    if err := database.DB.Where("user_id = ?", userID).First(&profile).Error; err != nil {
        // Nothing to delete
        c.JSON(http.StatusOK, gin.H{"message": "No profile or resume file to delete"})
        return
    }

    if profile.ResumeFile != "" {
        // Convert URL path to filesystem path
        relPath := strings.TrimPrefix(profile.ResumeFile, "/")
        oldFilePath := filepath.Join("/app", relPath)
        // Best-effort removal
        _ = os.Remove(oldFilePath)

        profile.ResumeFile = ""
        if err := database.DB.Save(&profile).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
            return
        }
    }

    c.JSON(http.StatusOK, gin.H{"message": "Resume file deleted"})
}
