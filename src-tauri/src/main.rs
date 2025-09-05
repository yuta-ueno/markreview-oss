// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use tauri::Emitter;

#[tauri::command]
fn get_command_line_args() -> Vec<String> {
    env::args().collect()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![get_command_line_args])
        .setup(|app| {
            // Get command line arguments and emit them to frontend
            let args: Vec<String> = env::args().collect();
            // Command line args processing
            
            // Tauri app setup
            
            // Skip the first argument (executable path) and check for file arguments
            if args.len() > 1 {
                let file_args: Vec<String> = args[1..].to_vec();
                // Processing file arguments
                
                // Filter for supported file extensions
                let supported_files: Vec<String> = file_args
                    .into_iter()
                    .filter(|path| {
                        let lower_path = path.to_lowercase();
                        let is_supported = lower_path.ends_with(".md") || 
                                         lower_path.ends_with(".markdown") || 
                                         lower_path.ends_with(".txt");
                        // Path validation check
                        is_supported
                    })
                    .collect();
                
                // Supported files identified
                
                if !supported_files.is_empty() {
                    // Clone for async block
                    let file_path = supported_files[0].clone();
                    let app_handle = app.handle().clone();
                    
                    // Delay emission to ensure frontend is ready
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(2000));
                        // Emitting file-args event with delay
                        let _result = app_handle.emit("tauri://file-args", &file_path);
                    });
                } else {
                    // No supported files found
                }
            } else {
                // No command line arguments provided
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}