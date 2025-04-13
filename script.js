document.addEventListener('DOMContentLoaded', function() {
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