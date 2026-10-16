// Pas de console noire derrière l'appli en version finale (ne pas retirer).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    montre_lib::run();
}
