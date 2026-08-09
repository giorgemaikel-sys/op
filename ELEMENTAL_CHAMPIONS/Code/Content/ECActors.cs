// Sistema de actores (personajes) elementales
using System;
using WorldBoxModLoader;

namespace ElementalChampions.Content
{
    public static class ECActors
    {
        // Campeones elementales únicos
        public static void RegisterAll()
        {
            Console.WriteLine("[ECActors] Registrando actores elementales...");
            
            // FIRE CLAN ACTORS
            RegisterActor("ec_actor_fire_warrior", "Guerrero de Fuego", 
                "Clan: Fuego", "fire", 
                baseHealth: 120, baseAttack: 25, baseDefense: 15);
            
            RegisterActor("ec_actor_fire_mage", "Mago de Fuego", 
                "Clan: Fuego", "fire", 
                baseHealth: 80, baseAttack: 35, baseDefense: 10);
            
            RegisterActor("ec_actor_champion_fire", "Ignis - Campeón del Fuego", 
                "Líder legendario del clan de fuego", "fire", 
                baseHealth: 500, baseAttack: 80, baseDefense: 40, isChampion: true);
            
            // WATER CLAN ACTORS
            RegisterActor("ec_actor_water_warrior", "Guerrero de Agua", 
                "Clan: Agua", "water", 
                baseHealth: 130, baseAttack: 20, baseDefense: 20);
            
            RegisterActor("ec_actor_water_healer", "Sanador de Agua", 
                "Clan: Agua", "water", 
                baseHealth: 90, baseAttack: 15, baseDefense: 15);
            
            RegisterActor("ec_actor_champion_water", "Aqualon - Campeón del Agua", 
                "Líder legendario del clan de agua", "water", 
                baseHealth: 550, baseAttack: 60, baseDefense: 50, isChampion: true);
            
            // EARTH CLAN ACTORS
            RegisterActor("ec_actor_earth_guardian", "Guardián de Tierra", 
                "Clan: Tierra", "earth", 
                baseHealth: 150, baseAttack: 22, baseDefense: 30);
            
            RegisterActor("ec_actor_earth_shaper", "Modelador de Tierra", 
                "Clan: Tierra", "earth", 
                baseHealth: 110, baseAttack: 28, baseDefense: 25);
            
            RegisterActor("ec_actor_champion_earth", "Terramax - Campeón de la Tierra", 
                "Líder legendario del clan de tierra", "earth", 
                baseHealth: 700, baseAttack: 70, baseDefense: 60, isChampion: true);
            
            // AIR CLAN ACTORS
            RegisterActor("ec_actor_air_scout", "Explorador de Aire", 
                "Clan: Aire", "air", 
                baseHealth: 100, baseAttack: 28, baseDefense: 12);
            
            RegisterActor("ec_actor_air_dancer", "Bailarín de Aire", 
                "Clan: Aire", "air", 
                baseHealth: 95, baseAttack: 30, baseDefense: 14);
            
            RegisterActor("ec_actor_champion_air", "Zephyros - Campeón del Aire", 
                "Líder legendario del clan de aire", "air", 
                baseHealth: 450, baseAttack: 75, baseDefense: 35, isChampion: true);
            
            // LIGHTNING CLAN ACTORS
            RegisterActor("ec_actor_lightning_striker", "Atacante de Rayo", 
                "Clan: Rayo", "lightning", 
                baseHealth: 110, baseAttack: 32, baseDefense: 13);
            
            RegisterActor("ec_actor_lightning_caller", "Invocador de Rayo", 
                "Clan: Rayo", "lightning", 
                baseHealth: 85, baseAttack: 40, baseDefense: 10);
            
            RegisterActor("ec_actor_champion_lightning", "Fulminax - Campeón del Rayo", 
                "Líder legendario del clan de rayo", "lightning", 
                baseHealth: 480, baseAttack: 85, baseDefense: 30, isChampion: true);
            
            Console.WriteLine("[ECActors] Actores registrados exitosamente!");
        }
        
        private static void RegisterActor(string id, string name, string description, string element, 
            int baseHealth, int baseAttack, int baseDefense, bool isChampion = false)
        {
            Core.ECRegistry.RegisterActor(id.Replace("ec_actor_", ""));
            string championMark = isChampion ? " [CAMPEÓN]" : "";
            Console.WriteLine($"  - {name}{championMark} ({element}): V={baseHealth}, A={baseAttack}, D={baseDefense}");
        }
    }
}
