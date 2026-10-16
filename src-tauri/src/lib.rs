//! Montre de concentration : enveloppe de bureau (Tauri).
//!
//! Toute l'interface (cadran, minuteur, météo, menu du clic droit) est dans `../src`.
//! Ce fichier ajoute ce qui relève du système :
//! - l'icône dans la zone de notification, près de l'horloge Windows ;
//! - la mémorisation de la position de la montre sur le bureau ;
//! - la fenêtre de choix d'un fichier de musique.

use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};
use tauri_plugin_window_state::StateFlags;

/// Libellé de la fenêtre principale (voir tauri.conf.json).
const MAIN_WINDOW: &str = "main";

/// Affiche la montre si elle est cachée, la cache sinon.
fn toggle_watch(app: &AppHandle) {
    let Some(window) = app.get_webview_window(MAIN_WINDOW) else {
        return;
    };
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
    } else {
        let _ = window.show();
    }
}

/// Crée l'icône de la zone de notification et son menu.
/// Clic gauche : afficher / cacher la montre. Clic droit : menu.
fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    let toggle = MenuItem::with_id(app, "toggle", "Afficher / masquer la montre", true, None::<&str>)?;
    let on_top = CheckMenuItem::with_id(app, "on_top", "Toujours au premier plan", true, true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quitter", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(app, &[&toggle, &on_top, &separator, &quit])?;

    let on_top_item = on_top.clone();
    TrayIconBuilder::with_id("tray")
        .icon(app.default_window_icon().cloned().expect("icône de l'appli manquante"))
        .tooltip("Montre de concentration")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "toggle" => toggle_watch(app),
            "on_top" => {
                // La case se coche ou se décoche d'elle-même au clic : on applique son état.
                if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
                    let checked = on_top_item.is_checked().unwrap_or(true);
                    let _ = window.set_always_on_top(checked);
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                toggle_watch(tray.app_handle());
            }
        })
        .build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Seule la position est mémorisée : la taille dépend du réglage choisi dans le menu.
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(StateFlags::POSITION)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            setup_tray(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("impossible de lancer la montre");
}
