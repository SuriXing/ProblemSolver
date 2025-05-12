import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaHeart, FaHandsHelping } from 'react-icons/fa';

// Import theme constants
import theme from './worry-solver-theme-constants';

// Header component
const Header = styled.header`
  background-color: ${theme.colors.white};
  box-shadow: ${theme.shadows.sm};
  padding: ${theme.spacing['4']} ${theme.spacing['6']};
  display: flex;
  justify-content: space-between;
  align-items: center;

  ${theme.mediaQueries.md} {
    padding: ${theme.spacing['4']} ${theme.spacing['8']};
  }
`;

const Logo = styled.div`
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.primary};
`;

const LanguageSelector = styled.select`
  padding: ${theme.spacing['1']} ${theme.spacing['2']};
  border-radius: ${theme.borders.radius.default};
  border: ${theme.borders.width.thin} ${theme.borders.style.solid} ${theme.colors.gray300};
  background-color: ${theme.colors.white};
  font-size: ${theme.typography.fontSize.sm};
  cursor: pointer;
  transition: border-color ${theme.transitions.duration.fast} ${theme.transitions.timing.ease};

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: ${theme.shadows.sm};
  }
`;

// Main content
const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${theme.spacing['6']} ${theme.spacing['4']};

  ${theme.mediaQueries.md} {
    padding: ${theme.spacing['12']} ${theme.spacing['6']};
  }
`;

const HeroSection = styled.section`
  text-align: center;
  margin-bottom: ${theme.spacing['12']};
`;

const HeroTitle = styled.h1`
  font-size: ${theme.typography.fontSize['4xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.gray900};
  margin-bottom: ${theme.spacing['4']};

  ${theme.mediaQueries.md} {
    font-size: ${theme.typography.fontSize['5xl']};
  }
`;

const HeroSubtitle = styled.p`
  font-size: ${theme.typography.fontSize.xl};
  color: ${theme.colors.gray600};
  max-width: 700px;
  margin: 0 auto;
  line-height: ${theme.typography.lineHeight.relaxed};
`;

const OptionsSection = styled.section`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: ${theme.spacing['8']};
  margin-top: ${theme.spacing['12']};

  ${theme.mediaQueries.md} {
    grid-template-columns: 1fr 1fr;
    grid-gap: ${theme.spacing['10']};
  }
`;

const OptionCard = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${theme.spacing['8']};
  background-color: ${theme.colors.white};
  border-radius: ${theme.borders.radius.lg};
  box-shadow: ${theme.shadows.md};
  text-decoration: none;
  transition: all ${theme.transitions.duration.default} ${theme.transitions.timing.easeInOut};
  border: ${theme.borders.width.thin} ${theme.borders.style.solid} ${theme.colors.gray200};
  text-align: center;

  &:hover {
    box-shadow: ${theme.shadows.lg};
    transform: translateY(-4px);
  }
`;

const OptionIconWrapper = styled.div<{ $bgColor: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: ${props => props.$bgColor};
  margin-bottom: ${theme.spacing['4']};
  color: ${theme.colors.white};
  font-size: ${theme.typography.fontSize['3xl']};
`;

const OptionTitle = styled.h2`
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.gray800};
  margin-bottom: ${theme.spacing['2']};
`;

const OptionDescription = styled.p`
  font-size: ${theme.typography.fontSize.lg};
  color: ${theme.colors.gray600};
  line-height: ${theme.typography.lineHeight.relaxed};
`;

// Footer
const Footer = styled.footer`
  background-color: ${theme.colors.gray100};
  padding: ${theme.spacing['6']} ${theme.spacing['4']};
  text-align: center;
  border-top: ${theme.borders.width.thin} ${theme.borders.style.solid} ${theme.colors.gray200};
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: ${theme.spacing['6']};
  margin-bottom: ${theme.spacing['4']};
  flex-wrap: wrap;
`;

const FooterLink = styled(Link)`
  color: ${theme.colors.gray600};
  text-decoration: none;
  font-size: ${theme.typography.fontSize.sm};
  transition: color ${theme.transitions.duration.fast} ${theme.transitions.timing.ease};

  &:hover {
    color: ${theme.colors.primary};
    text-decoration: underline;
  }
`;

const Copyright = styled.p`
  font-size: ${theme.typography.fontSize.xs};
  color: ${theme.colors.gray500};
`;

// Main component
const HomePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };
  
  return (
    <>
      <Header>
        <Logo>worry-solver</Logo>
        <LanguageSelector value={i18n.language} onChange={handleLanguageChange}>
          <option value="en">English</option>
          <option value="zh">中文</option>
          <option value="es">Español</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
        </LanguageSelector>
      </Header>
      
      <MainContent>
        <HeroSection>
          <HeroTitle>{t('home.heroTitle')}</HeroTitle>
          <HeroSubtitle>{t('home.heroSubtitle')}</HeroSubtitle>
        </HeroSection>
        
        <OptionsSection>
          <OptionCard to="/submit">
            <OptionIconWrapper $bgColor={theme.colors.secondary}>
              <FaHeart />
            </OptionIconWrapper>
            <OptionTitle>{t('home.confessionOption.title')}</OptionTitle>
            <OptionDescription>{t('home.confessionOption.description')}</OptionDescription>
          </OptionCard>
          
          <OptionCard to="/help">
            <OptionIconWrapper $bgColor={theme.colors.primary}>
              <FaHandsHelping />
            </OptionIconWrapper>
            <OptionTitle>{t('home.helpOption.title')}</OptionTitle>
            <OptionDescription>{t('home.helpOption.description')}</OptionDescription>
          </OptionCard>
        </OptionsSection>
      </MainContent>
      
      <Footer>
        <FooterLinks>
          <FooterLink to="/about">{t('footer.about')}</FooterLink>
          <FooterLink to="/privacy">{t('footer.privacy')}</FooterLink>
          <FooterLink to="/terms">{t('footer.terms')}</FooterLink>
          <FooterLink to="/contact">{t('footer.contact')}</FooterLink>
        </FooterLinks>
        <Copyright>&copy; {new Date().getFullYear()} worry-solver</Copyright>
      </Footer>
    </>
  );
};

export default HomePage;

// Translation keys used in this component:
/*
{
  "home": {
    "heroTitle": "Share Your Worries, Find Clarity",
    "heroSubtitle": "A safe space to confess your problems and help others solve theirs.",
    "confessionOption": {
      "title": "Share Your Worry",
      "description": "Confess anonymously and receive responses from those who care."
    },
    "helpOption": {
      "title": "Help Others",
      "description": "Provide guidance and support to people in need of advice."
    }
  },
  "footer": {
    "about": "About",
    "privacy": "Privacy Policy",
    "terms": "Terms of Service",
    "contact": "Contact Us"
  }
}
*/ 