// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State, Window};

// Window configuration and state structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowConfig {
    pub window_type: String,
    pub title: String,
    pub width: f64,
    pub height: f64,
    pub x: Option<f64>,
    pub y: Option<f64>,
    pub resizable: bool,
    pub minimizable: bool,
    pub maximizable: bool,
    pub closable: bool,
    pub always_on_top: bool,
    pub decorations: bool,
    pub transparent: bool,
    pub focus: bool,
    pub fullscreen: bool,
    pub url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowState {
    pub label: String,
    pub config: WindowConfig,
    pub z_order: u32,
    pub is_focused: bool,
    pub is_minimized: bool,
    pub is_maximized: bool,
    pub monitor_id: Option<String>,
    pub created_at: u64,
    pub last_focused_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorInfo {
    pub id: String,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub scale_factor: f64,
    pub is_primary: bool,
}

// Window registry for state tracking
pub struct WindowRegistry {
    windows: HashMap<String, WindowState>,
    z_order_counter: u32,
    focused_window: Option<String>,
}

impl WindowRegistry {
    pub fn new() -> Self {
        Self {
            windows: HashMap::new(),
            z_order_counter: 0,
            focused_window: None,
        }
    }

    pub fn add_window(&mut self, label: String, config: WindowConfig) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;

        self.z_order_counter += 1;

        let window_state = WindowState {
            label: label.clone(),
            config,
            z_order: self.z_order_counter,
            is_focused: true,
            is_minimized: false,
            is_maximized: false,
            monitor_id: None,
            created_at: now,
            last_focused_at: now,
        };

        // Update focus
        if let Some(prev_focused) = &self.focused_window {
            if let Some(prev_window) = self.windows.get_mut(prev_focused) {
                prev_window.is_focused = false;
            }
        }
        self.focused_window = Some(label.clone());

        self.windows.insert(label, window_state);
    }

    pub fn remove_window(&mut self, label: &str) {
        self.windows.remove(label);
        if self.focused_window.as_ref() == Some(&label.to_string()) {
            self.focused_window = None;
            // Focus the most recently created window
            if let Some((_, most_recent)) = self.windows.iter_mut()
                .max_by_key(|(_, state)| state.last_focused_at) {
                most_recent.is_focused = true;
                self.focused_window = Some(most_recent.label.clone());
            }
        }
    }

    pub fn focus_window(&mut self, label: &str) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;

        // Unfocus previously focused window
        if let Some(prev_focused) = &self.focused_window {
            if let Some(prev_window) = self.windows.get_mut(prev_focused) {
                prev_window.is_focused = false;
            }
        }

        // Focus new window
        if let Some(window) = self.windows.get_mut(label) {
            window.is_focused = true;
            window.last_focused_at = now;
            self.z_order_counter += 1;
            window.z_order = self.z_order_counter;
            self.focused_window = Some(label.to_string());
        }
    }

    pub fn get_windows_by_z_order(&self) -> Vec<&WindowState> {
        let mut windows: Vec<&WindowState> = self.windows.values().collect();
        windows.sort_by(|a, b| b.z_order.cmp(&a.z_order));
        windows
    }

    pub fn get_window(&self, label: &str) -> Option<&WindowState> {
        self.windows.get(label)
    }

    pub fn get_focused_window(&self) -> Option<&WindowState> {
        if let Some(focused_label) = &self.focused_window {
            self.windows.get(focused_label)
        } else {
            None
        }
    }

    pub fn update_window_state(&mut self, label: &str, is_minimized: Option<bool>, is_maximized: Option<bool>, monitor_id: Option<String>) {
        if let Some(window) = self.windows.get_mut(label) {
            if let Some(minimized) = is_minimized {
                window.is_minimized = minimized;
            }
            if let Some(maximized) = is_maximized {
                window.is_maximized = maximized;
            }
            if let Some(monitor) = monitor_id {
                window.monitor_id = Some(monitor);
            }
        }
    }
}

type WindowRegistryState = Mutex<WindowRegistry>;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Advanced window creation and management APIs
#[tauri::command]
async fn create_app_window(
    app: AppHandle,
    window_type: String,
    config: WindowConfig,
    registry_state: State<'_, WindowRegistryState>,
) -> Result<String, String> {
    let label = format!("{}_{}", window_type, std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis());

    let url = config.url.clone().unwrap_or_else(|| "index.html".to_string());

    let mut builder = tauri::webview::WebviewWindowBuilder::new(&app, &label, tauri::WebviewUrl::App(url.into()))
        .title(&config.title)
        .inner_size(config.width, config.height)
        .resizable(config.resizable)
        .minimizable(config.minimizable)
        .maximizable(config.maximizable)
        .closable(config.closable)
        .always_on_top(config.always_on_top)
        .decorations(config.decorations)
        .transparent(config.transparent)
        .focus(config.focus)
        .fullscreen(config.fullscreen);

    if let Some(x) = config.x {
        if let Some(y) = config.y {
            builder = builder.position(x, y);
        }
    }

    let window = builder.build().map_err(|e| e.to_string())?;

    // Add to registry
    {
        let mut registry = registry_state.lock().unwrap();
        registry.add_window(label.clone(), config);
    }

    // Set up window event listeners
    let registry_clone = registry_state.clone();
    let label_clone = label.clone();
    window.on_window_event(move |event| {
        match event {
            tauri::WindowEvent::Focused(focused) => {
                let mut registry = registry_clone.lock().unwrap();
                if *focused {
                    registry.focus_window(&label_clone);
                }
            }
            tauri::WindowEvent::CloseRequested { .. } => {
                let mut registry = registry_clone.lock().unwrap();
                registry.remove_window(&label_clone);
            }
            _ => {}
        }
    });

    Ok(label)
}

#[tauri::command]
async fn close_app_window(
    label: String,
    app: AppHandle,
    registry_state: State<'_, WindowRegistryState>,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.close().map_err(|e| e.to_string())?;
    }

    {
        let mut registry = registry_state.lock().unwrap();
        registry.remove_window(&label);
    }

    Ok(())
}

#[tauri::command]
async fn focus_app_window(
    label: String,
    app: AppHandle,
    registry_state: State<'_, WindowRegistryState>,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.set_focus().map_err(|e| e.to_string())?;
    }

    {
        let mut registry = registry_state.lock().unwrap();
        registry.focus_window(&label);
    }

    Ok(())
}

#[tauri::command]
async fn minimize_window(
    label: String,
    app: AppHandle,
    registry_state: State<'_, WindowRegistryState>,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.minimize().map_err(|e| e.to_string())?;
    }

    {
        let mut registry = registry_state.lock().unwrap();
        registry.update_window_state(&label, Some(true), None, None);
    }

    Ok(())
}

#[tauri::command]
async fn maximize_window(
    label: String,
    app: AppHandle,
    registry_state: State<'_, WindowRegistryState>,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.maximize().map_err(|e| e.to_string())?;
    }

    {
        let mut registry = registry_state.lock().unwrap();
        registry.update_window_state(&label, None, Some(true), None);
    }

    Ok(())
}

#[tauri::command]
async fn unmaximize_window(
    label: String,
    app: AppHandle,
    registry_state: State<'_, WindowRegistryState>,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.unmaximize().map_err(|e| e.to_string())?;
    }

    {
        let mut registry = registry_state.lock().unwrap();
        registry.update_window_state(&label, None, Some(false), None);
    }

    Ok(())
}

#[tauri::command]
async fn resize_app_window(
    label: String,
    width: f64,
    height: f64,
    app: AppHandle,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width: width as u32,
            height: height as u32
        })).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
async fn move_window(
    label: String,
    x: f64,
    y: f64,
    app: AppHandle,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: x as i32,
            y: y as i32
        })).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
async fn get_window_list(
    registry_state: State<'_, WindowRegistryState>,
) -> Result<Vec<WindowState>, String> {
    let registry = registry_state.lock().unwrap();
    Ok(registry.get_windows_by_z_order().into_iter().cloned().collect())
}

#[tauri::command]
async fn get_focused_window(
    registry_state: State<'_, WindowRegistryState>,
) -> Result<Option<WindowState>, String> {
    let registry = registry_state.lock().unwrap();
    Ok(registry.get_focused_window().cloned())
}

#[tauri::command]
async fn get_monitors() -> Result<Vec<MonitorInfo>, String> {
    // This would require platform-specific implementations
    // For now, return a mock implementation
    Ok(vec![MonitorInfo {
        id: "primary".to_string(),
        name: "Primary Monitor".to_string(),
        width: 1920,
        height: 1080,
        x: 0,
        y: 0,
        scale_factor: 1.0,
        is_primary: true,
    }])
}

// Window persistence specific commands
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowPositionSize {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub is_maximized: bool,
    pub is_minimized: bool,
    pub is_fullscreen: bool,
    pub monitor: u32,
    pub monitor_name: Option<String>,
}

#[tauri::command]
async fn get_monitor_info() -> Result<Vec<MonitorInfo>, String> {
    // Platform-specific monitor detection would go here
    // For cross-platform compatibility, we'll implement a basic version

    #[cfg(target_os = "windows")]
    {
        // Windows-specific monitor enumeration
        get_windows_monitors()
    }

    #[cfg(target_os = "macos")]
    {
        // macOS-specific monitor enumeration
        get_macos_monitors()
    }

    #[cfg(target_os = "linux")]
    {
        // Linux-specific monitor enumeration
        get_linux_monitors()
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        // Fallback for other platforms
        Ok(vec![MonitorInfo {
            id: "primary".to_string(),
            name: "Primary Monitor".to_string(),
            width: 1920,
            height: 1080,
            x: 0,
            y: 0,
            scale_factor: 1.0,
            is_primary: true,
        }])
    }
}

#[cfg(target_os = "windows")]
fn get_windows_monitors() -> Result<Vec<MonitorInfo>, String> {
    // For now, return mock data. In production, this would use Windows API
    Ok(vec![MonitorInfo {
        id: "primary".to_string(),
        name: "Primary Monitor".to_string(),
        width: 1920,
        height: 1080,
        x: 0,
        y: 0,
        scale_factor: 1.0,
        is_primary: true,
    }])
}

#[cfg(target_os = "macos")]
fn get_macos_monitors() -> Result<Vec<MonitorInfo>, String> {
    // For now, return mock data. In production, this would use macOS APIs
    Ok(vec![MonitorInfo {
        id: "primary".to_string(),
        name: "Primary Monitor".to_string(),
        width: 1920,
        height: 1080,
        x: 0,
        y: 0,
        scale_factor: 1.0,
        is_primary: true,
    }])
}

#[cfg(target_os = "linux")]
fn get_linux_monitors() -> Result<Vec<MonitorInfo>, String> {
    // For now, return mock data. In production, this would use X11/Wayland APIs
    Ok(vec![MonitorInfo {
        id: "primary".to_string(),
        name: "Primary Monitor".to_string(),
        width: 1920,
        height: 1080,
        x: 0,
        y: 0,
        scale_factor: 1.0,
        is_primary: true,
    }])
}

#[tauri::command]
async fn get_all_window_states(
    app: AppHandle,
    registry_state: State<'_, WindowRegistryState>,
) -> Result<std::collections::HashMap<String, WindowPositionSize>, String> {
    let registry = registry_state.lock().unwrap();
    let mut result = std::collections::HashMap::new();

    for (label, window_state) in registry.windows.iter() {
        if let Some(window) = app.get_webview_window(label) {
            let position = window.outer_position().map_err(|e| e.to_string())?;
            let size = window.outer_size().map_err(|e| e.to_string())?;
            let is_maximized = window.is_maximized().map_err(|e| e.to_string())?;
            let is_minimized = window.is_minimized().map_err(|e| e.to_string())?;
            let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;

            result.insert(label.clone(), WindowPositionSize {
                x: position.x as f64,
                y: position.y as f64,
                width: size.width as f64,
                height: size.height as f64,
                is_maximized,
                is_minimized,
                is_fullscreen,
                monitor: 0, // Default to primary monitor
                monitor_name: window_state.monitor_id.clone(),
            });
        }
    }

    Ok(result)
}

#[tauri::command]
async fn set_window_state(
    label: String,
    state: WindowPositionSize,
    app: AppHandle,
    registry_state: State<'_, WindowRegistryState>,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        // Set position
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: state.x as i32,
            y: state.y as i32,
        })).map_err(|e| e.to_string())?;

        // Set size
        window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width: state.width as u32,
            height: state.height as u32,
        })).map_err(|e| e.to_string())?;

        // Set maximized state
        if state.is_maximized {
            window.maximize().map_err(|e| e.to_string())?;
        } else {
            window.unmaximize().map_err(|e| e.to_string())?;
        }

        // Set minimized state
        if state.is_minimized {
            window.minimize().map_err(|e| e.to_string())?;
        } else {
            window.unminimize().map_err(|e| e.to_string())?;
        }

        // Set fullscreen state
        window.set_fullscreen(state.is_fullscreen).map_err(|e| e.to_string())?;

        // Update registry
        {
            let mut registry = registry_state.lock().unwrap();
            registry.update_window_state(
                &label,
                Some(state.is_minimized),
                Some(state.is_maximized),
                state.monitor_name,
            );
        }
    }

    Ok(())
}

// Window switching and keyboard shortcuts
#[tauri::command]
async fn cycle_windows(
    forward: bool,
    registry_state: State<'_, WindowRegistryState>,
    app: AppHandle,
) -> Result<(), String> {
    let current_focused = {
        let registry = registry_state.lock().unwrap();
        registry.get_focused_window().map(|w| w.label.clone())
    };

    let windows = {
        let registry = registry_state.lock().unwrap();
        registry.get_windows_by_z_order().into_iter().map(|w| w.label.clone()).collect::<Vec<_>>()
    };

    if windows.is_empty() {
        return Ok(());
    }

    let next_window = if let Some(current) = current_focused {
        if let Some(current_index) = windows.iter().position(|w| w == &current) {
            if forward {
                windows.get((current_index + 1) % windows.len())
            } else {
                if current_index == 0 {
                    windows.last()
                } else {
                    windows.get(current_index - 1)
                }
            }
        } else {
            windows.first()
        }
    } else {
        windows.first()
    };

    if let Some(window_label) = next_window {
        focus_app_window(window_label.clone(), app, registry_state).await?;
    }

    Ok(())
}

// Window snapping and arrangement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SnapPosition {
    Left,
    Right,
    Top,
    Bottom,
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
    Center,
    Maximize,
}

#[tauri::command]
async fn snap_window(
    label: String,
    position: SnapPosition,
    app: AppHandle,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        // Get monitor dimensions (mock for now)
        let monitor_width = 1920.0;
        let monitor_height = 1080.0;
        let half_width = monitor_width / 2.0;
        let half_height = monitor_height / 2.0;

        match position {
            SnapPosition::Left => {
                window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: 0, y: 0 })).map_err(|e| e.to_string())?;
                window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                    width: half_width as u32,
                    height: monitor_height as u32
                })).map_err(|e| e.to_string())?;
            }
            SnapPosition::Right => {
                window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                    x: half_width as i32,
                    y: 0
                })).map_err(|e| e.to_string())?;
                window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                    width: half_width as u32,
                    height: monitor_height as u32
                })).map_err(|e| e.to_string())?;
            }
            SnapPosition::Top => {
                window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: 0, y: 0 })).map_err(|e| e.to_string())?;
                window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                    width: monitor_width as u32,
                    height: half_height as u32
                })).map_err(|e| e.to_string())?;
            }
            SnapPosition::Bottom => {
                window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                    x: 0,
                    y: half_height as i32
                })).map_err(|e| e.to_string())?;
                window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                    width: monitor_width as u32,
                    height: half_height as u32
                })).map_err(|e| e.to_string())?;
            }
            SnapPosition::TopLeft => {
                window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: 0, y: 0 })).map_err(|e| e.to_string())?;
                window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                    width: half_width as u32,
                    height: half_height as u32
                })).map_err(|e| e.to_string())?;
            }
            SnapPosition::TopRight => {
                window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                    x: half_width as i32,
                    y: 0
                })).map_err(|e| e.to_string())?;
                window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                    width: half_width as u32,
                    height: half_height as u32
                })).map_err(|e| e.to_string())?;
            }
            SnapPosition::BottomLeft => {
                window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                    x: 0,
                    y: half_height as i32
                })).map_err(|e| e.to_string())?;
                window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                    width: half_width as u32,
                    height: half_height as u32
                })).map_err(|e| e.to_string())?;
            }
            SnapPosition::BottomRight => {
                window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                    x: half_width as i32,
                    y: half_height as i32
                })).map_err(|e| e.to_string())?;
                window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                    width: half_width as u32,
                    height: half_height as u32
                })).map_err(|e| e.to_string())?;
            }
            SnapPosition::Center => {
                let center_width = monitor_width * 0.7;
                let center_height = monitor_height * 0.7;
                window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                    x: ((monitor_width - center_width) / 2.0) as i32,
                    y: ((monitor_height - center_height) / 2.0) as i32
                })).map_err(|e| e.to_string())?;
                window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                    width: center_width as u32,
                    height: center_height as u32
                })).map_err(|e| e.to_string())?;
            }
            SnapPosition::Maximize => {
                window.maximize().map_err(|e| e.to_string())?;
            }
        }
    }

    Ok(())
}

// Window state persistence
#[tauri::command]
async fn save_window_state(
    registry_state: State<'_, WindowRegistryState>,
) -> Result<(), String> {
    let registry = registry_state.lock().unwrap();
    let windows: Vec<WindowState> = registry.get_windows_by_z_order().into_iter().cloned().collect();

    // Save to a JSON file (simplified implementation)
    let app_data_dir = std::env::var("APPDATA").unwrap_or_else(|_| "/tmp".to_string());
    let save_path = format!("{}/politicail_windows.json", app_data_dir);

    let json_data = serde_json::to_string_pretty(&windows).map_err(|e| e.to_string())?;
    std::fs::write(save_path, json_data).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn load_window_state(
    app: AppHandle,
    registry_state: State<'_, WindowRegistryState>,
) -> Result<Vec<String>, String> {
    let app_data_dir = std::env::var("APPDATA").unwrap_or_else(|_| "/tmp".to_string());
    let save_path = format!("{}/politicail_windows.json", app_data_dir);

    if !std::path::Path::new(&save_path).exists() {
        return Ok(vec![]);
    }

    let json_data = std::fs::read_to_string(save_path).map_err(|e| e.to_string())?;
    let saved_windows: Vec<WindowState> = serde_json::from_str(&json_data).map_err(|e| e.to_string())?;

    let mut restored_labels = Vec::new();

    for window_state in saved_windows {
        let result = create_app_window(
            app.clone(),
            window_state.config.window_type.clone(),
            window_state.config.clone(),
            registry_state.clone()
        ).await;

        if let Ok(label) = result {
            restored_labels.push(label.clone());

            // Restore window position and size
            if let Some(x) = window_state.config.x {
                if let Some(y) = window_state.config.y {
                    let _ = move_window(label.clone(), x, y, app.clone()).await;
                }
            }

            let _ = resize_app_window(
                label.clone(),
                window_state.config.width,
                window_state.config.height,
                app.clone()
            ).await;

            // Restore window state
            if window_state.is_minimized {
                let _ = minimize_window(label.clone(), app.clone(), registry_state.clone()).await;
            } else if window_state.is_maximized {
                let _ = maximize_window(label.clone(), app.clone(), registry_state.clone()).await;
            }
        }
    }

    Ok(restored_labels)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(WindowRegistryState::new(WindowRegistry::new()))
        .invoke_handler(tauri::generate_handler![
            greet,
            create_window,
            close_window,
            resize_window,
            create_app_window,
            close_app_window,
            focus_app_window,
            minimize_window,
            maximize_window,
            unmaximize_window,
            resize_app_window,
            move_window,
            get_window_list,
            get_focused_window,
            get_monitors,
            get_monitor_info,
            get_all_window_states,
            set_window_state,
            cycle_windows,
            snap_window,
            save_window_state,
            load_window_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}