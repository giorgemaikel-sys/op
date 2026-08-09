// Sistema de efectos especiales elementales
using System;
using WorldBoxModLoader;

namespace ElementalChampions.Content
{
    public static class ECEffects
    {
        public static void RegisterAll()
        {
            Console.WriteLine("[ECEffects] Registrando efectos elementales...");
            
            // FIRE EFFECTS
            RegisterEffect("ec_effect_burning", "Quemadura", 
                "Daño continuo por fuego. -5 vida/seg.", 
                duration: 10, isHarmful: true);
            
            RegisterEffect("ec_effect_inferno", "Infierno", 
                "Área de fuego masivo. -20 vida/seg a enemigos cercanos.", 
                duration: 5, isHarmful: true);
            
            // WATER EFFECTS
            RegisterEffect("ec_effect_healing_water", "Curación Acuática", 
                "Regenera vida en presencia de agua. +10 vida/seg.", 
                duration: 15, isHarmful: false);
            
            RegisterEffect("ec_effect_drown", "Ahogamiento", 
                "Daño por estar bajo el agua sin afinidad. -8 vida/seg.", 
                duration: 8, isHarmful: true);
            
            // EARTH EFFECTS
            RegisterEffect("ec_effect_stone_skin", "Piel de Piedra", 
                "+100% defensa temporal.", 
                duration: 20, isHarmful: false);
            
            RegisterEffect("ec_effect_poison_immunity", "Inmunidad a Veneno", 
                "Inmune a todos los venenos.", 
                duration: 60, isHarmful: false);
            
            // AIR EFFECTS
            RegisterEffect("ec_effect_flight", "Vuelo", 
                "Puede volar sobre terreno y agua.", 
                duration: 30, isHarmful: false);
            
            RegisterEffect("ec_effect_wind_boost", "Impulso de Viento", 
                "+50% velocidad de movimiento.", 
                duration: 15, isHarmful: false);
            
            // LIGHTNING EFFECTS
            RegisterEffect("ec_effect_electrocute", "Electrocutado", 
                "Daño eléctrico + parálisis temporal.", 
                duration: 5, isHarmful: true);
            
            RegisterEffect("ec_effect_lightning_strike", "Impacto de Rayo", 
                "Daño masivo en área. -50 vida instantáneo.", 
                duration: 1, isHarmful: true);
            
            // CHAMPION ABILITIES
            RegisterEffect("ec_effect_flame_eruption", "Erupción Ígnea", 
                "Habilidad del Campeón de Fuego. Daño masivo en área grande.", 
                duration: 3, isHarmful: true);
            
            RegisterEffect("ec_effect_tidal_wave", "Ola Tsunami", 
                "Habilidad del Campeón de Agua. Empuja y daña enemigos.", 
                duration: 5, isHarmful: true);
            
            RegisterEffect("ec_effect_earthquake", "Terremoto", 
                "Habilidad del Campeón de Tierra. Daño y aturdimiento en área.", 
                duration: 4, isHarmful: true);
            
            RegisterEffect("ec_effect_cyclone", "Ciclón", 
                "Habilidad del Campeón de Aire. Levanta enemigos al aire.", 
                duration: 6, isHarmful: true);
            
            RegisterEffect("ec_effect_thunderstorm", "Tormenta Eléctrica", 
                "Habilidad del Campeón de Rayo. Múltiples impactos de rayo.", 
                duration: 8, isHarmful: true);
            
            Console.WriteLine("[ECEffects] Efectos registrados exitosamente!");
        }
        
        private static void RegisterEffect(string id, string name, string description, int duration = 10, bool isHarmful = false)
        {
            Core.ECRegistry.RegisterEffect(id.Replace("ec_effect_", ""));
            string type = isHarmful ? "DAÑINO" : "BENEFICIOSO";
            Console.WriteLine($"  - {name} [{type}, {duration}s]: {description}");
        }
    }
}
