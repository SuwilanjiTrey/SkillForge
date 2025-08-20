import React from 'react';

const styles = (theme) => {
  return {
    container: {
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme === 'dark' ? '#0f0f23' : '#ffffff',
      color: theme === 'dark' ? '#cccccc' : '#333333',
      fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace"
    },
    header: {
      backgroundColor: theme === 'dark' ? '#1e1e2e' : '#f8f9fa',
      borderBottom: `1px solid ${theme === 'dark' ? '#313244' : '#e9ecef'}`,
      padding: '1rem'
    },
    headerContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      margin: 0,
      fontSize: '1.5rem',
      fontWeight: 'bold'
    },
    headerActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    themeToggle: {
      background: 'none',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
      padding: '0.5rem',
      borderRadius: '0.5rem',
      backgroundColor: theme === 'dark' ? '#313244' : '#e9ecef'
    },
    languageTabs: {
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap'
    },
    languageTab: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '500',
      transition: 'all 0.2s',
      backgroundColor: theme === 'dark' ? '#313244' : '#e9ecef',
      color: 'inherit'
    },
    activeTab: {
      backgroundColor: theme === 'dark' ? '#585b70' : '#007bff',
      color: theme === 'dark' ? '#cdd6f4' : '#ffffff'
    },
    mobileNav: {
      display: 'flex',
      borderBottom: `1px solid ${theme === 'dark' ? '#313244' : '#e9ecef'}`,
      backgroundColor: theme === 'dark' ? '#1e1e2e' : '#f8f9fa'
    },
    mobileNavButton: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      padding: '1rem',
      border: 'none',
      backgroundColor: 'transparent',
      color: 'inherit',
      cursor: 'pointer',
      borderBottom: '3px solid transparent'
    },
    activeMobileNav: {
      borderBottomColor: theme === 'dark' ? '#cdd6f4' : '#007bff',
      backgroundColor: theme === 'dark' ? '#313244' : '#e3f2fd'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      overflow: 'hidden'
    },
    panel: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      borderRight: `1px solid ${theme === 'dark' ? '#313244' : '#e9ecef'}`
    },
    panelHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      backgroundColor: theme === 'dark' ? '#1e1e2e' : '#f8f9fa',
      borderBottom: `1px solid ${theme === 'dark' ? '#313244' : '#e9ecef'}`
    },
    panelTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      margin: 0,
      fontSize: '1rem',
      fontWeight: '600'
    },
    languageBadge: {
      backgroundColor: theme === 'dark' ? '#45475a' : '#6c757d',
      color: '#ffffff',
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: '500'
    },
    panelActions: {
      display: 'flex',
      gap: '0.5rem'
    },
    actionButton: {
      background: 'none',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
      padding: '0.5rem',
      borderRadius: '0.25rem',
      backgroundColor: theme === 'dark' ? '#313244' : '#e9ecef'
    },
    codeEditor: {
      flex: 1,
      padding: '1rem',
      border: 'none',
      resize: 'none',
      fontFamily: 'inherit',
      fontSize: '14px',
      lineHeight: '1.5',
      backgroundColor: theme === 'dark' ? '#0f0f23' : '#ffffff',
      color: 'inherit',
      outline: 'none'
    },
    runButtonContainer: {
      padding: '1rem',
      borderTop: `1px solid ${theme === 'dark' ? '#313244' : '#e9ecef'}`
    },
    runButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      width: '100%',
      padding: '0.75rem',
      border: 'none',
      borderRadius: '0.5rem',
      backgroundColor: '#10b981',
      color: '#ffffff',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    runButtonDisabled: {
      backgroundColor: theme === 'dark' ? '#374151' : '#6b7280',
      cursor: 'not-allowed'
    },
    outputPanel: {
      borderRight: 'none'
    },
    outputContent: {
      flex: 1,
      padding: '1rem',
      fontFamily: 'inherit',
      fontSize: '14px',
      lineHeight: '1.6',
      whiteSpace: 'pre-wrap',
      overflow: 'auto',
      backgroundColor: theme === 'dark' ? '#181825' : '#f8f9fa'
    },
    outputPlaceholder: {
      color: theme === 'dark' ? '#6c7086' : '#6c757d',
      fontStyle: 'italic'
    },
    hiddenMd: {
      display: 'none'
    },
    fab: {
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 1000
    },
    fabButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '1rem 1.5rem',
      borderRadius: '50px',
      border: 'none',
      backgroundColor: '#10b981',
      color: '#ffffff',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.2s'
    }
  };
};

export default styles;
