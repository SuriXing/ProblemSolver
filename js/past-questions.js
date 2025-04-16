document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const accessCodeInput = document.getElementById('accessCodeInput');
    const fetchQuestionsBtn = document.getElementById('fetchQuestionsBtn');
    const loadDemoBtn = document.getElementById('loadDemoBtn');
    const questionsContainer = document.getElementById('questionsContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const noQuestionsMessage = document.getElementById('noQuestionsMessage');

    // Event Listeners
    fetchQuestionsBtn.addEventListener('click', () => fetchQuestions(accessCodeInput.value));
    loadDemoBtn.addEventListener('click', () => fetchQuestions('demo'));
    
    // Allow pressing Enter in the input field to submit
    accessCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchQuestions(accessCodeInput.value);
        }
    });

    /**
     * Fetch questions based on the provided access code
     * @param {string} accessCode - The access code to fetch questions for
     */
    function fetchQuestions(accessCode) {
        if (!accessCode) {
            showError('Please enter an access code');
            return;
        }

        // Show loading indicator
        resetMessages();
        showLoading(true);

        // In a real app, this would be an API call
        // For demo purposes, we'll simulate an API call with setTimeout
        setTimeout(() => {
            if (accessCode === 'demo' || accessCode === 'test123') {
                const questions = getQuestions(accessCode);
                if (questions.length > 0) {
                    displayQuestions(questions);
                } else {
                    showNoQuestions();
                }
            } else {
                showError();
            }
            showLoading(false);
        }, 1500);
    }

    /**
     * Display questions in the container
     * @param {Array} questions - Array of question objects
     */
    function displayQuestions(questions) {
        questionsContainer.innerHTML = '';
        
        questions.forEach(question => {
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card';
            
            // Calculate time ago
            const timeAgo = getTimeAgo(question.timestamp);
            
            questionCard.innerHTML = `
                <div class="question-header">
                    <h3 class="question-title">${question.title}</h3>
                    <div class="question-meta">
                        <span class="question-category">${question.category}</span>
                        <span class="question-time">${timeAgo}</span>
                    </div>
                </div>
                <p class="question-preview">${question.preview}</p>
                <div class="question-footer">
                    <div class="question-stats">
                        <span class="question-views"><i class="fas fa-eye"></i> ${question.views}</span>
                        <span class="question-answers"><i class="fas fa-comment-dots"></i> ${question.answers}</span>
                    </div>
                    <a href="question.html?id=${question.id}" class="view-question-btn">View Full Question</a>
                </div>
            `;
            
            questionsContainer.appendChild(questionCard);
        });
    }

    /**
     * Helper function to format dates as "time ago"
     * @param {string} timestamp - ISO timestamp
     * @returns {string} - Formatted time ago string
     */
    function getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now - past;
        
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        
        if (diffMonths > 0) {
            return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
        } else if (diffWeeks > 0) {
            return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
        } else if (diffDays > 0) {
            return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
        } else if (diffHours > 0) {
            return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
        } else if (diffMins > 0) {
            return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
        } else {
            return 'Just now';
        }
    }

    /**
     * Show or hide the loading indicator
     * @param {boolean} show - Whether to show the loading indicator
     */
    function showLoading(show) {
        if (show) {
            loadingIndicator.classList.remove('hidden');
        } else {
            loadingIndicator.classList.add('hidden');
        }
    }

    /**
     * Show error message
     * @param {string} message - Optional custom error message
     */
    function showError(message = 'Invalid access code. Please try again or contact support.') {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    /**
     * Show no questions message
     */
    function showNoQuestions() {
        noQuestionsMessage.classList.remove('hidden');
    }

    /**
     * Reset all message containers
     */
    function resetMessages() {
        errorMessage.classList.add('hidden');
        noQuestionsMessage.classList.add('hidden');
        questionsContainer.innerHTML = '';
    }

    /**
     * Get sample questions based on access code
     * @param {string} accessCode - The access code
     * @returns {Array} - Array of question objects
     */
    function getQuestions(accessCode) {
        // In a real app, these would come from an API
        
        const demoQuestions = [
            {
                id: 'd1',
                title: 'How do I solve a quadratic equation?',
                preview: 'I need help understanding how to factor quadratic equations and use the quadratic formula to find solutions...',
                category: 'Mathematics',
                timestamp: '2023-09-01T10:30:00Z',
                views: 245,
                answers: 12
            },
            {
                id: 'd2',
                title: 'What is the difference between mitosis and meiosis?',
                preview: 'I\'m studying cell division and I\'m confused about the difference between these two processes...',
                category: 'Biology',
                timestamp: '2023-09-05T14:22:00Z',
                views: 189,
                answers: 8
            },
            {
                id: 'd3',
                title: 'How do I balance chemical equations?',
                preview: 'I\'m having trouble understanding how to balance chemical equations properly. Can someone explain the process?',
                category: 'Chemistry',
                timestamp: '2023-09-15T09:15:00Z',
                views: 312,
                answers: 15
            },
            {
                id: 'd4',
                title: 'Analyzing themes in Shakespeare\'s Macbeth',
                preview: 'I need help identifying and analyzing the major themes in Macbeth for my literature essay...',
                category: 'Literature',
                timestamp: '2023-09-22T16:45:00Z',
                views: 178,
                answers: 6
            },
            {
                id: 'd5',
                title: 'Understanding Newton\'s Laws of Motion',
                preview: 'Can someone help me understand the practical applications of Newton\'s three laws of motion?',
                category: 'Physics',
                timestamp: '2023-09-28T11:30:00Z',
                views: 256,
                answers: 10
            }
        ];
        
        const testQuestions = [
            {
                id: 't1',
                title: 'How do I calculate the derivative of a function?',
                preview: 'I\'m having trouble with the power rule and chain rule when finding derivatives...',
                category: 'Calculus',
                timestamp: '2023-09-10T08:45:00Z',
                views: 203,
                answers: 9
            },
            {
                id: 't2',
                title: 'Tips for writing a persuasive essay',
                preview: 'I need advice on structuring arguments and using rhetorical devices in my persuasive essay...',
                category: 'Writing',
                timestamp: '2023-09-18T13:20:00Z',
                views: 176,
                answers: 7
            },
            {
                id: 't3',
                title: 'Understanding photosynthesis process',
                preview: 'Can someone explain the light-dependent and light-independent reactions in photosynthesis?',
                category: 'Biology',
                timestamp: '2023-09-25T15:10:00Z',
                views: 224,
                answers: 11
            }
        ];
        
        if (accessCode === 'demo') {
            return demoQuestions;
        } else if (accessCode === 'test123') {
            return testQuestions;
        }
        
        return [];
    }
}); 