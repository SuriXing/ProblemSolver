document.addEventListener('DOMContentLoaded', function() {
    // Element references
    const startConfessionBtn = document.getElementById('start-confession-btn');
    const homeView = document.getElementById('home-view');
    const helpView = document.getElementById('help-view');
    
    // Helper function to get translations
    function t(key) {
        return window.i18n ? window.i18n.t(key) : key;
    }
    
    // Event listeners for the home page buttons
    if (startConfessionBtn) {
        startConfessionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Handle directly in JavaScript instead of relying on URL parameters
            // This ensures it works even if URL parameters aren't processed correctly
            
            // Create the confession view if not already created
            if (!document.getElementById('confession-view')) {
                const confessionView = document.createElement('section');
                confessionView.id = 'confession-view';
                confessionView.className = 'confession-view';
                confessionView.innerHTML = `
                    <div class="confession-header">
                        <h1 class="confession-title" data-i18n="confessionTitle">${t('confessionTitle')}</h1>
                        <p class="confession-subtitle" data-i18n="confessionSubtitle">${t('confessionSubtitle')}</p>
                    </div>
                    <div class="confession-form">
                        <div class="confession-image">
                            <img src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80" alt="信件">
                        </div>
                        <textarea placeholder="${t('confessionPlaceholder')}" data-i18n="confessionPlaceholder"></textarea>
                        <div class="tag-selector">
                            <p data-i18n="addTags">${t('addTags')}</p>
                            <div class="tags">
                                <span class="tag" data-i18n="tagPressure">${t('tagPressure')}</span>
                                <span class="tag" data-i18n="tagAnxiety">${t('tagAnxiety')}</span>
                                <span class="tag" data-i18n="tagInsomnia">${t('tagInsomnia')}</span>
                                <span class="tag" data-i18n="tagRelationship">${t('tagRelationship')}</span>
                                <span class="tag" data-i18n="tagWork">${t('tagWork')}</span>
                                <span class="tag" data-i18n="tagStudy">${t('tagStudy')}</span>
                            </div>
                        </div>
                        <div class="confession-options">
                            <div class="privacy-options">
                                <p data-i18n="privacySettings">${t('privacySettings')}</p>
                                <div class="radio-options">
                                    <label class="radio-label">
                                        <input type="radio" name="privacy" value="public" checked>
                                        <span class="radio-custom"></span>
                                        <span data-i18n="publicQuestion">${t('publicQuestion')}</span>
                                    </label>
                                    <label class="radio-label">
                                        <input type="radio" name="privacy" value="private">
                                        <span class="radio-custom"></span>
                                        <span data-i18n="privateQuestion">${t('privateQuestion')}</span>
                                    </label>
                                </div>
                            </div>
                            <div class="notification-option">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="email-notification">
                                    <span class="checkbox-custom"></span>
                                    <span data-i18n="emailNotify">${t('emailNotify')}</span>
                                </label>
                                <div class="email-input-container" style="display: none;">
                                    <input type="email" placeholder="${t('emailPlaceholder')}" data-i18n="emailPlaceholder" class="email-input">
                                </div>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button class="submit-confession-btn">
                                <i class="fas fa-paper-plane"></i> <span data-i18n="send">${t('send')}</span>
                            </button>
                        </div>
                    </div>`;
                
                // Insert the confession view after the home view
                homeView.parentNode.insertBefore(confessionView, homeView.nextSibling);
                
                // Add event listener to the submit button
                const submitConfessionBtn = document.querySelector('.submit-confession-btn');
                if (submitConfessionBtn) {
                    submitConfessionBtn.addEventListener('click', () => {
                        const confessionText = document.querySelector('.confession-form textarea').value.trim();
                        const emailNotification = document.getElementById('email-notification').checked;
                        const emailInput = document.querySelector('.email-input');
                        let validSubmission = true;
                        
                        if (!confessionText) {
                            alert(t('enterThoughts'));
                            validSubmission = false;
                        }
                        
                        if (emailNotification && emailInput && !emailInput.value.trim()) {
                            alert(t('enterEmail'));
                            validSubmission = false;
                        }
                        
                        if (validSubmission) {
                            // Collect form data for submission
                            const privacyOption = document.querySelector('input[name="privacy"]:checked').value;
                            const selectedTags = Array.from(document.querySelectorAll('.tag.selected')).map(tag => tag.textContent);
                            const emailAddress = emailNotification && emailInput ? emailInput.value.trim() : '';
                            
                            // Generate a random user ID
                            const userId = Math.floor(1000 + Math.random() * 9000);
                            
                            // Generate a unique access code
                            const accessCode = generateAccessCode();
                            
                            // Store data in sessionStorage for the success page
                            const submissionData = {
                                confessionText,
                                privacyOption,
                                selectedTags,
                                emailNotification,
                                emailAddress,
                                userId,
                                accessCode
                            };
                            
                            sessionStorage.setItem('submissionData', JSON.stringify(submissionData));
                            
                            // In a real app, this would send the data to a server
                            console.log(submissionData);
                            
                            // Redirect to the success page
                            window.location.href = 'success.html';
                        }
                    });
                }
                
                // Add event listeners for tag selection
                const tags = document.querySelectorAll('.tag');
                if (tags.length > 0) {
                    tags.forEach(tag => {
                        tag.addEventListener('click', () => {
                            tag.classList.toggle('selected');
                        });
                    });
                }
                
                // Add event listener for email notification checkbox
                const emailNotificationCheckbox = document.getElementById('email-notification');
                const emailInputContainer = document.querySelector('.email-input-container');
                
                if (emailNotificationCheckbox && emailInputContainer) {
                    emailNotificationCheckbox.addEventListener('change', () => {
                        emailInputContainer.style.display = emailNotificationCheckbox.checked ? 'block' : 'none';
                    });
                }
            }
            
            // Hide home view and show confession view
            homeView.classList.add('hidden');
            document.getElementById('confession-view').classList.remove('hidden');
            
            // Update the URL without refreshing the page to help with navigation
            history.pushState({}, '', 'index.html?view=confession');
        });
    }
    
    // Function to generate a unique access code
    function generateAccessCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar-looking characters
        let code = '';
        
        // Generate three groups of four characters
        for (let group = 0; group < 3; group++) {
            for (let i = 0; i < 4; i++) {
                const randomIndex = Math.floor(Math.random() * chars.length);
                code += chars[randomIndex];
            }
            if (group < 2) code += '-';
        }
        
        return code;
    }
    
    // Success page functionality (for confession submission)
    const confessionPreview = document.getElementById('confession-preview');
    const confessionTags = document.getElementById('confession-tags');
    const userIdSpan = document.getElementById('user-id');
    const accessCodeSpan = document.getElementById('access-code');
    const copyCodeBtn = document.getElementById('copy-code-btn');
    
    if (confessionPreview && userIdSpan) {
        // We're on the success page, populate with data from sessionStorage
        const submissionData = JSON.parse(sessionStorage.getItem('submissionData') || '{}');
        
        if (submissionData.confessionText) {
            confessionPreview.textContent = submissionData.confessionText;
            userIdSpan.textContent = submissionData.userId || '3842';
            
            if (accessCodeSpan) {
                accessCodeSpan.textContent = submissionData.accessCode || 'XXXX-XXXX-XXXX';
            }
            
            // Populate tags if they exist
            if (confessionTags && submissionData.selectedTags && submissionData.selectedTags.length > 0) {
                confessionTags.innerHTML = '';
                submissionData.selectedTags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'message-tag';
                    tagElement.textContent = tag;
                    confessionTags.appendChild(tagElement);
                });
            } else if (confessionTags) {
                // Add some default tags if none were selected
                const defaultTags = [t('tagThoughts'), t('tagLife')];
                confessionTags.innerHTML = '';
                defaultTags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'message-tag';
                    tagElement.textContent = tag;
                    confessionTags.appendChild(tagElement);
                });
            }
        }
        
        // Add copy functionality to the copy button
        if (copyCodeBtn && accessCodeSpan) {
            copyCodeBtn.addEventListener('click', () => {
                const codeText = accessCodeSpan.textContent;
                navigator.clipboard.writeText(codeText).then(() => {
                    copyCodeBtn.classList.add('copied');
                    copyCodeBtn.querySelector('i').classList.remove('fa-regular', 'fa-copy');
                    copyCodeBtn.querySelector('i').classList.add('fa-solid', 'fa-circle-check');
                    setTimeout(() => {
                        copyCodeBtn.classList.remove('copied');
                        copyCodeBtn.querySelector('i').classList.remove('fa-solid', 'fa-circle-check');
                        copyCodeBtn.querySelector('i').classList.add('fa-regular', 'fa-copy');
                    }, 2000);
                });
            });
        }
    }
    
    // Helper success page functionality
    const questionPreview = document.getElementById('question-preview');
    const questionTags = document.getElementById('question-tags');
    const posterIdSpan = document.getElementById('poster-id');
    const replyContent = document.getElementById('reply-content');
    const todayHelpedSpan = document.getElementById('today-helped');
    const totalHelpedSpan = document.getElementById('total-helped');
    const totalThanksSpan = document.getElementById('total-thanks');
    
    if (questionPreview && replyContent) {
        // We're on the helper success page, populate with data from sessionStorage
        const helperData = JSON.parse(sessionStorage.getItem('helperData') || '{}');
        
        if (helperData.questionText) {
            questionPreview.textContent = helperData.questionText;
            posterIdSpan.textContent = helperData.posterId || '2831';
            replyContent.textContent = helperData.replyText || t('yourReply');
            
            if (helperData.questionTags && helperData.questionTags.length > 0 && questionTags) {
                questionTags.innerHTML = '';
                helperData.questionTags.forEach(tag => {
                    const tagSpan = document.createElement('span');
                    tagSpan.className = 'message-tag';
                    tagSpan.textContent = tag;
                    questionTags.appendChild(tagSpan);
                });
            }
        }
    }
    
    // Function to update the helper stats
    function updateHelperStats() {
        const todayHelped = document.querySelector('.help-stats .stat-item:nth-child(1)');
        if (todayHelped) {
            const currentCount = parseInt(todayHelped.textContent.match(/\d+/)[0]);
            todayHelped.innerHTML = `<i class="fas fa-heart"></i> <span data-i18n="todayHelped">${t('todayHelped')}</span>: ${currentCount + 1}<span data-i18n="people">${t('people')}</span>`;
        }
        
        const totalHelped = document.querySelector('.help-stats .stat-item:nth-child(2)');
        if (totalHelped) {
            const currentCount = parseInt(totalHelped.textContent.match(/\d+/)[0]);
            totalHelped.innerHTML = `<i class="fas fa-users"></i> <span data-i18n="totalHelped">${t('totalHelped')}</span>: ${currentCount + 1}<span data-i18n="people">${t('people')}</span>`;
        }
    }
    
    // Handle URL parameters to potentially show different views
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view');
    
    // This would be used if we want to control views with URL parameters
    if (view === 'help' && homeView && helpView) {
        homeView.classList.add('hidden');
        helpView.classList.remove('hidden');
    } else if (view === 'confession' && homeView && !document.getElementById('confession-view')) {
        // If we're loading the page with the confession view parameter,
        // trigger the button click to handle the view creation and display
        if (startConfessionBtn) {
            startConfessionBtn.click();
        }
    }
    
    // 为选项卡片添加悬停效果
    const optionCards = document.querySelectorAll('.option-card');
    
    optionCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            // 添加轻微上移动画
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            // 恢复原始状态
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.05)';
        });
    });
    
    // 为按钮添加点击效果
    const buttons = document.querySelectorAll('.btn-primary');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // 添加波纹效果
            let ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            
            let x = e.clientX - this.getBoundingClientRect().left;
            let y = e.clientY - this.getBoundingClientRect().top;
            
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // 模拟页面加载动画
    const body = document.body;
    body.classList.add('loaded');
    
    // 监听滚动事件，实现淡入效果
    const fadeElements = document.querySelectorAll('.option-card, .hero-title, .hero-subtitle');
    
    function checkFade() {
        fadeElements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            const elementBottom = el.getBoundingClientRect().bottom;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100 && elementBottom > 0) {
                el.classList.add('visible');
            }
        });
    }
    
    // 初始检查
    checkFade();
    
    // 滚动时检查
    window.addEventListener('scroll', checkFade);
}); 