import { useEffect } from 'react';
import { useUI } from '../context/UIContext';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const { toggleCommandPalette, closeCommandPalette, isCommandPaletteOpen } = useUI();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Cmd+K or Ctrl+K -> Toggle command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // '/' key opens command palette when not typing in an input
      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // Escape closes command palette
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        e.preventDefault();
        closeCommandPalette();
        return;
      }

      // 'N' opens new Challan creator when not typing in an input
      if (e.key.toLowerCase() === 'n' && !isInputFocused && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate('/challans/create');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette, closeCommandPalette, isCommandPaletteOpen, navigate]);
}
