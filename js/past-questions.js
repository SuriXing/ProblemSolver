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
            showError('Please enter an access code to view your post');
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
            
            // Create the question card content
            questionCard.innerHTML = `
                <div class="question-header">
                    <h3 class="question-title">${question.title}</h3>
                    <div class="question-meta">
                        <span class="question-category">${question.category}</span>
                        <span class="question-time">${timeAgo}</span>
                    </div>
                </div>
                <p class="question-preview">${question.preview}</p>
                <div class="question-content hidden">
                    <h4>Full Question:</h4>
                    <div class="question-text">${question.fullContent || question.preview}</div>
                </div>
                <div class="question-replies hidden">
                    <h4>Replies (${question.replies ? question.replies.length : 0}):</h4>
                    <div class="replies-container">
                        ${renderReplies(question.replies || [])}
                    </div>
                </div>
                <div class="question-footer">
                    <div class="question-stats">
                        <span class="question-views"><i class="fas fa-eye"></i> ${question.views}</span>
                        <span class="question-answers"><i class="fas fa-comment-dots"></i> ${question.answers}</span>
                    </div>
                    <button class="view-details-btn">View Details</button>
                </div>
            `;
            
            questionsContainer.appendChild(questionCard);
            
            // Add event listener to toggle details
            const viewDetailsBtn = questionCard.querySelector('.view-details-btn');
            viewDetailsBtn.addEventListener('click', () => {
                const content = questionCard.querySelector('.question-content');
                const replies = questionCard.querySelector('.question-replies');
                
                // Toggle display of full content and replies
                if (content.classList.contains('hidden')) {
                    content.classList.remove('hidden');
                    replies.classList.remove('hidden');
                    viewDetailsBtn.textContent = 'Hide Details';
                    questionCard.classList.add('expanded');
                } else {
                    content.classList.add('hidden');
                    replies.classList.add('hidden');
                    viewDetailsBtn.textContent = 'View Details';
                    questionCard.classList.remove('expanded');
                }
            });
        });
    }
    
    /**
     * Render replies for a question
     * @param {Array} replies - Array of reply objects
     * @returns {string} - HTML for replies
     */
    function renderReplies(replies) {
        if (replies.length === 0) {
            return `<div class="no-replies">No replies yet to this question. Check back later.</div>`;
        }
        
        return replies.map(reply => `
            <div class="reply-card">
                <div class="reply-header">
                    <div class="reply-author">
                        <i class="fas fa-user-circle"></i> 
                        ${reply.author || 'Staff'}
                    </div>
                    <div class="reply-time">${getTimeAgo(reply.timestamp)}</div>
                </div>
                <div class="reply-content">
                    ${reply.content}
                </div>
            </div>
        `).join('');
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
    function showError(message = 'We couldn\'t find a post with this access code. Please check your access code and try again.') {
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
                fullContent: 'I need help understanding how to factor quadratic equations and use the quadratic formula to find solutions. I\'m working on problems like ax² + bx + c = 0, but I get confused about when to factor and when to use the formula. Could someone explain the steps clearly?',
                category: 'Mathematics',
                timestamp: '2023-09-01T10:30:00Z',
                views: 245,
                answers: 12,
                replies: [
                    {
                        author: 'Math Tutor',
                        timestamp: '2023-09-01T11:45:00Z',
                        content: 'For a quadratic equation ax² + bx + c = 0, you have two main approaches:<br><br>1. <strong>Factoring:</strong> Try to express it as (px + q)(rx + s) = 0. This works well when the solutions are "clean" numbers.<br><br>2. <strong>Quadratic Formula:</strong> When factoring is difficult, use x = (-b ± √(b² - 4ac)) / 2a to find solutions.<br><br>I recommend trying factoring first. If that doesn\'t work smoothly, then apply the formula.'
                    },
                    {
                        author: 'Math Professor',
                        timestamp: '2023-09-01T14:22:00Z',
                        content: 'To add to the above, here\'s a step-by-step approach:<br><br>1. Try to factor if a=1 or a is small.<br>2. For equations like x² + bx + c, look for two numbers that multiply to give c and add to give b.<br>3. If factoring seems difficult, go straight to the quadratic formula.<br>4. Don\'t forget to check your answers by substituting back into the original equation.'
                    }
                ]
            },
            {
                id: 'd2',
                title: 'What is the difference between mitosis and meiosis?',
                preview: 'I\'m studying cell division and I\'m confused about the difference between these two processes...',
                fullContent: 'I\'m studying cell division and I\'m confused about the difference between mitosis and meiosis. They seem similar but have different purposes. Can someone explain the key differences and when each process occurs in organisms?',
                category: 'Biology',
                timestamp: '2023-09-05T14:22:00Z',
                views: 189,
                answers: 8,
                replies: [
                    {
                        author: 'Biology TA',
                        timestamp: '2023-09-05T16:15:00Z',
                        content: '<strong>Mitosis:</strong><br>- Creates 2 identical daughter cells<br>- Maintains the same chromosome count (diploid to diploid)<br>- Used for growth and repair<br>- One division phase<br><br><strong>Meiosis:</strong><br>- Creates 4 daughter cells<br>- Reduces chromosome count (diploid to haploid)<br>- Used for sexual reproduction<br>- Two division phases<br>- Includes crossing over for genetic diversity'
                    },
                    {
                        author: 'Cell Biology Professor',
                        timestamp: '2023-09-06T09:30:00Z',
                        content: 'The key difference is the purpose: mitosis is for growth/repair while meiosis is for sexual reproduction. In mitosis, you get exact copies of the parent cell. In meiosis, you get genetic recombination through crossing over, which creates genetic diversity essential for evolution.'
                    }
                ]
            },
            {
                id: 'd3',
                title: 'How do I balance chemical equations?',
                preview: 'I\'m having trouble understanding how to balance chemical equations properly. Can someone explain the process?',
                fullContent: 'I\'m having trouble understanding how to balance chemical equations properly. Can someone explain the step-by-step process? For example, how would you balance something like H₂ + O₂ → H₂O?',
                category: 'Chemistry',
                timestamp: '2023-09-15T09:15:00Z',
                views: 312,
                answers: 15,
                replies: [
                    {
                        author: 'Chemistry Tutor',
                        timestamp: '2023-09-15T10:05:00Z',
                        content: 'Here\'s a step-by-step approach:<br><br>1. Write the unbalanced equation: H₂ + O₂ → H₂O<br>2. Count atoms on each side (H: 2 left, 2 right; O: 2 left, 1 right)<br>3. Balance one element at a time, usually starting with the most complex molecule<br>4. Put a coefficient of 2 in front of H₂O: H₂ + O₂ → 2H₂O<br>5. Recount (H: 2 left, 4 right; O: 2 left, 2 right)<br>6. Now we need to balance H by putting 2 in front of H₂: 2H₂ + O₂ → 2H₂O<br>7. Final check: 4 H atoms and 2 O atoms on each side'
                    }
                ]
            },
            {
                id: 'd4',
                title: 'Analyzing themes in Shakespeare\'s Macbeth',
                preview: 'I need help identifying and analyzing the major themes in Macbeth for my literature essay...',
                fullContent: 'I need help identifying and analyzing the major themes in Shakespeare\'s Macbeth for my literature essay. I understand ambition is a key theme, but what are other significant themes and how do they develop throughout the play?',
                category: 'Literature',
                timestamp: '2023-09-22T16:45:00Z',
                views: 178,
                answers: 6,
                replies: [
                    {
                        author: 'Literature Professor',
                        timestamp: '2023-09-22T18:20:00Z',
                        content: 'Besides ambition, key themes in Macbeth include:<br><br>1. <strong>Fate vs. Free Will</strong>: The witches\' prophecies suggest fate, but Macbeth\'s choices highlight free will.<br><br>2. <strong>Appearance vs. Reality</strong>: "Fair is foul, and foul is fair" - things are not what they seem.<br><br>3. <strong>Guilt and Conscience</strong>: Lady Macbeth\'s sleepwalking and Macbeth\'s visions of Banquo\'s ghost.<br><br>4. <strong>Corrupting Power of Unchecked Ambition</strong>: Macbeth\'s moral deterioration.<br><br>5. <strong>Gender Roles</strong>: Lady Macbeth\'s "unsex me here" speech challenges Elizabethan gender expectations.'
                    },
                    {
                        author: 'Shakespeare Scholar',
                        timestamp: '2023-09-23T10:15:00Z',
                        content: 'To analyze these themes effectively, look at how they evolve over the course of the play. For instance, Macbeth initially struggles with his conscience (the dagger scene), but gradually becomes more comfortable with violence. By the end, he\'s numb to the news of Lady Macbeth\'s death ("Tomorrow, and tomorrow, and tomorrow..."). This shows how his ambition has completely corrupted his humanity.'
                    }
                ]
            },
            {
                id: 'd5',
                title: 'Understanding Newton\'s Laws of Motion',
                preview: 'Can someone help me understand the practical applications of Newton\'s three laws of motion?',
                fullContent: 'Can someone help me understand the practical applications of Newton\'s three laws of motion? I understand the theory but I\'m having trouble connecting it to real-world examples.',
                category: 'Physics',
                timestamp: '2023-09-28T11:30:00Z',
                views: 256,
                answers: 10,
                replies: [
                    {
                        author: 'Physics TA',
                        timestamp: '2023-09-28T12:45:00Z',
                        content: '<strong>First Law (Inertia):</strong><br>- Seatbelts work because they prevent your body from continuing in motion during a sudden stop<br>- A tablecloth can be pulled out from under dishes if done quickly enough<br><br><strong>Second Law (F=ma):</strong><br>- Pushing a shopping cart (same force moves a full cart less than an empty one)<br>- Rockets expel gas to generate force and accelerate<br><br><strong>Third Law (Equal and opposite reactions):</strong><br>- Walking: you push the ground backward, ground pushes you forward<br>- Recoil when firing a gun<br>- Swimming: pushing water backward propels you forward'
                    },
                    {
                        author: 'Engineering Professor',
                        timestamp: '2023-09-29T09:10:00Z',
                        content: 'In engineering applications, Newton\'s laws are fundamental. For example, when designing vehicles, we calculate forces using the second law to determine appropriate materials and structures. The third law explains why propulsion works in aircraft and rockets. Even in robotics, understanding these principles is crucial for designing movement and balance systems.'
                    }
                ]
            }
        ];
        
        const testQuestions = [
            {
                id: 't1',
                title: 'How do I calculate the derivative of a function?',
                preview: 'I\'m having trouble with the power rule and chain rule when finding derivatives...',
                fullContent: 'I\'m having trouble with the power rule and chain rule when finding derivatives. Could someone provide a clear explanation of how to use these rules together with examples?',
                category: 'Calculus',
                timestamp: '2023-09-10T08:45:00Z',
                views: 203,
                answers: 9,
                replies: [
                    {
                        author: 'Calculus Tutor',
                        timestamp: '2023-09-10T09:30:00Z',
                        content: '<strong>Power Rule:</strong> For a function f(x) = x^n, the derivative is f\'(x) = n·x^(n-1)<br><br><strong>Chain Rule:</strong> For a composite function f(g(x)), the derivative is f\'(g(x))·g\'(x)<br><br>For example, if f(x) = (x² + 3)⁵, you would:<br>1. Identify the outer function: [x² + 3]⁵<br>2. Identify the inner function: x² + 3<br>3. Apply chain rule: 5·(x² + 3)⁴ · (derivative of x² + 3)<br>4. Calculate inner derivative: 2x<br>5. Final answer: 5·(x² + 3)⁴ · 2x = 10x(x² + 3)⁴'
                    }
                ]
            },
            {
                id: 't2',
                title: 'Tips for writing a persuasive essay',
                preview: 'I need advice on structuring arguments and using rhetorical devices in my persuasive essay...',
                fullContent: 'I need advice on structuring arguments and using rhetorical devices in my persuasive essay. How can I make my writing more convincing and impactful?',
                category: 'Writing',
                timestamp: '2023-09-18T13:20:00Z',
                views: 176,
                answers: 7,
                replies: [
                    {
                        author: 'Writing Instructor',
                        timestamp: '2023-09-18T14:15:00Z',
                        content: 'For a persuasive essay, consider these key elements:<br><br>1. <strong>Clear thesis statement</strong> that takes a strong position<br><br>2. <strong>Strong evidence</strong> - statistics, expert quotes, relevant examples<br><br>3. <strong>Logical structure</strong>: introduction with hook and thesis, body paragraphs with topic sentences, and conclusion that reinforces your point<br><br>4. <strong>Rhetorical devices</strong>:<br> - Ethos: Establish your credibility<br> - Pathos: Appeal to emotions<br> - Logos: Use logical reasoning<br><br>5. <strong>Anticipate counterarguments</strong> and address them effectively'
                    },
                    {
                        author: 'Rhetoric Professor',
                        timestamp: '2023-09-19T10:05:00Z',
                        content: 'Beyond the basics, consider these rhetorical techniques:<br><br>- <strong>Anaphora</strong>: Repetition at the beginning of sentences (e.g., "We shall fight on the beaches, we shall fight on the landing grounds...")<br><br>- <strong>Rhetorical questions</strong>: Engage readers by making them think<br><br>- <strong>Tricolon</strong>: Groups of three (e.g., "Education, education, education")<br><br>- <strong>Analogy</strong>: Making connections between different concepts<br><br>Remember to vary sentence structure and use transitions between paragraphs for smooth flow.'
                    }
                ]
            },
            {
                id: 't3',
                title: 'Understanding photosynthesis process',
                preview: 'Can someone explain the light-dependent and light-independent reactions in photosynthesis?',
                fullContent: 'Can someone explain the light-dependent and light-independent reactions in photosynthesis? I\'m trying to understand how these two stages work together to produce glucose.',
                category: 'Biology',
                timestamp: '2023-09-25T15:10:00Z',
                views: 224,
                answers: 11,
                replies: [
                    {
                        author: 'Plant Biology TA',
                        timestamp: '2023-09-25T16:20:00Z',
                        content: '<strong>Light-Dependent Reactions:</strong><br>- Occur in thylakoid membranes<br>- Capture light energy using chlorophyll<br>- Split water molecules (H₂O → 2H⁺ + ½O₂ + 2e⁻)<br>- Generate ATP and NADPH<br>- Release oxygen as a byproduct<br><br><strong>Light-Independent Reactions (Calvin Cycle):</strong><br>- Occur in the stroma<br>- Use ATP and NADPH from light-dependent reactions<br>- Fix carbon dioxide (CO₂)<br>- Produce glucose and other carbohydrates<br>- Recycle ADP, Pi, and NADP⁺ to be used again in light-dependent reactions'
                    },
                    {
                        author: 'Botany Professor',
                        timestamp: '2023-09-26T09:45:00Z',
                        content: 'Think of the process as an energy conversion system. The light-dependent reactions convert light energy to chemical energy (ATP and NADPH). The light-independent reactions then use this chemical energy to build sugar molecules from CO₂. It\'s like charging a battery in the light reactions, then using that stored energy in the Calvin cycle to do work (make sugar). The two stages are interconnected and dependent on each other to complete the full process of photosynthesis.'
                    }
                ]
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