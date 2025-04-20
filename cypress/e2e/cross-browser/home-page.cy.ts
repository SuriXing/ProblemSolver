describe('Home Page Cross-Browser Testing', () => {
  const viewports = Cypress.env('viewports');

  // Function to test at different viewport sizes
  function testAtViewport(viewportName: string, width: number, height: number) {
    context(`Testing on ${viewportName} (${width}x${height})`, () => {
      beforeEach(() => {
        cy.viewport(width, height);
        cy.visit('/');
        // Wait for page to fully load
        cy.wait(1000);
      });

      it('should display the hero section correctly', () => {
        cy.get('[data-testid="hero-section"]').should('be.visible');
        // Take a screenshot for visual comparison
        cy.screenshot(`home-hero-${viewportName}`);
      });

      it('should display the option cards correctly', () => {
        cy.get('[data-testid="option-cards"]').should('be.visible');
        cy.get('[data-testid="option-card"]').should('have.length.at.least', 2);
        // Take a screenshot for visual comparison
        cy.screenshot(`home-cards-${viewportName}`);
      });

      it('should have working navigation links', () => {
        // Test navigation to confession page
        cy.get('[data-testid="confession-link"]').click();
        cy.url().should('include', '/submit-query');
        cy.go('back');
        
        // Test navigation to help page
        cy.get('[data-testid="help-link"]').click();
        cy.url().should('include', '/help');
      });

      // Test animations, but only check if they're present since visual testing is better for checking appearance
      it('should have animations on elements', () => {
        cy.get('[data-testid="animated-element"]').should('exist');
      });

      // Test language selection if present
      it('should change language when selected', () => {
        cy.get('[data-testid="language-selector"]').click();
        cy.get('[data-testid="language-option-en"]').click();
        // Check that some text element shows English
        cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome');
      });
    });
  }

  // Run tests for each viewport
  Object.entries(viewports).forEach(([name, dimensions]) => {
    testAtViewport(name, dimensions.width, dimensions.height);
  });
  
  // Additional test for mobile navigation
  context('Mobile Navigation', () => {
    beforeEach(() => {
      // Use a mobile viewport
      cy.viewport(viewports['mobile-medium'].width, viewports['mobile-medium'].height);
      cy.visit('/');
    });

    it('should show hamburger menu on mobile', () => {
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
      cy.get('[data-testid="mobile-menu-button"]').click();
      cy.get('[data-testid="mobile-menu"]').should('be.visible');
      // Take a screenshot for visual comparison
      cy.screenshot('mobile-menu-open');
    });

    it('should navigate correctly through mobile menu', () => {
      cy.get('[data-testid="mobile-menu-button"]').click();
      cy.get('[data-testid="mobile-menu-help-link"]').click();
      cy.url().should('include', '/help');
    });
  });
}); 