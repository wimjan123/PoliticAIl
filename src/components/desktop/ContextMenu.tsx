import { useEffect, useRef } from 'react';
import { useDesktop } from '../../contexts/DesktopContext';
import type { ContextMenuItem } from '../../types/desktop';
import '../../styles/components/context-menu.css';

interface ContextMenuItemProps {
  item: ContextMenuItem;
  theme: any;
  onItemClick: (item: ContextMenuItem) => void;
}

function ContextMenuItemComponent({ item, theme, onItemClick }: ContextMenuItemProps) {
  if (item.separator) {
    return <div className="context-menu-separator" style={{ backgroundColor: theme.colors.secondary }} />;
  }

  return (
    <button
      className={`context-menu-item ${item.disabled ? 'disabled' : ''}`}
      onClick={() => !item.disabled && onItemClick(item)}
      disabled={item.disabled}
      style={{
        color: item.disabled ? `${theme.colors.text}40` : theme.colors.text,
        backgroundColor: 'transparent',
      }}
    >
      <div className="menu-item-content">
        {item.icon && <span className="menu-item-icon">{item.icon}</span>}
        <span className="menu-item-label">{item.label}</span>
        {item.shortcut && (
          <span className="menu-item-shortcut" style={{ color: `${theme.colors.text}60` }}>
            {item.shortcut}
          </span>
        )}
      </div>
      {item.submenu && (
        <span className="menu-item-arrow" style={{ color: `${theme.colors.text}60` }}>
          ▶
        </span>
      )}
    </button>
  );
}

export function ContextMenu() {
  const { state, actions } = useDesktop();
  const { contextMenu, theme } = state;
  const menuRef = useRef<HTMLDivElement>(null);

  // Position the menu to stay within viewport
  useEffect(() => {
    if (menuRef.current && contextMenu.visible) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { x, y } = contextMenu.position;

      // Adjust horizontal position if menu would overflow
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }
      if (x < 10) {
        x = 10;
      }

      // Adjust vertical position if menu would overflow
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }
      if (y < 10) {
        y = 10;
      }

      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
    }
  }, [contextMenu.visible, contextMenu.position]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        actions.hideContextMenu();
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [contextMenu.visible, actions]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.onClick) {
      item.onClick();
    }
    actions.hideContextMenu();
  };

  if (!contextMenu.visible) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        backgroundColor: theme.colors.background,
        borderColor: theme.colors.secondary,
        boxShadow: `0 4px 12px ${theme.colors.background}40`,
        left: contextMenu.position.x,
        top: contextMenu.position.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {contextMenu.items.map((item, index) => (
        <ContextMenuItemComponent
          key={item.id || `item-${index}`}
          item={item}
          theme={theme}
          onItemClick={handleItemClick}
        />
      ))}
    </div>
  );
}