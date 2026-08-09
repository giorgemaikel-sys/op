using System;
using System.Collections.Generic;
using WorldBoxAPI.API;
using WorldBoxAPI.API.Data;
using WorldBoxAPI.API.Enums;

namespace ElementalChaos.Core
{
    public static class ElementalRegistry
    {
        // IDs de clanes elementales
        public static readonly string CLAN_FIRE = "ec_fire";
        public static readonly string CLAN_WATER = "ec_water";
        public static readonly string CLAN_EARTH = "ec_earth";
        public static readonly string CLAN_AIR = "ec_air";
        
        // IDs de traits
        public static readonly string TRAIT_PYROMANCER = "ec_pyromancer";
        public static readonly string TRAIT_HYDROMANCER = "ec_hydromancer";
        public static readonly string TRAIT_GEOMANCER = "ec_geomancer";
        public static readonly string TRAIT_AEROMANCER = "ec_aeromancer";
        
        // IDs de héroes
        public static readonly string HERO_INFERNO = "ec_hero_inferno";
        public static readonly string HERO_TIDAL = "ec_hero_tidal";
        public static readonly string HERO_TERRA = "ec_hero_terra";
        public static readonly string HERO_ZEPHYR = "ec_hero_zephyr";
        
        // IDs de efectos
        public static readonly string EFFECT_BURN = "ec_burn";
        public static readonly string EFFECT_FREEZE = "ec_freeze";
        public static readonly string EFFECT_ROOT = "ec_root";
        public static readonly string EFFECT_STORM = "ec_storm";
        
        private static bool _initialized = false;
        
        public static void Initialize()
        {
            if (_initialized) return;
            
            Console.WriteLine("[ElementalRegistry] Registrando clanes...");
            RegisterClans();
            
            Console.WriteLine("[ElementalRegistry] Registro completado.");
            _initialized = true;
        }
        
        private static void RegisterClans()
        {
            // Clan Fuego - Agresivo, alta fuerza
            var fireClan = new RaceData
            {
                id = CLAN_FIRE,
                name = "Fireborn",
                color = new Color32(255, 100, 50, 255),
                isEvil = false,
                canBeCreated = true,
                defaultLifespan = 150,
                defaultStrength = 8,
                defaultSpirit = 4,
                defaultMana = 6
            };
            RaceManager.AddRace(fireClan);
            
            // Clan Agua - Defensivo, alto espíritu
            var waterClan = new RaceData
            {
                id = CLAN_WATER,
                name = "Watereach",
                color = new Color32(50, 150, 255, 255),
                isEvil = false,
                canBeCreated = true,
                defaultLifespan = 180,
                defaultStrength = 5,
                defaultSpirit = 9,
                defaultMana = 7
            };
            RaceManager.AddRace(waterClan);
            
            // Clan Tierra - Tanque, alta vida
            var earthClan = new RaceData
            {
                id = CLAN_EARTH,
                name = "Stoneheart",
                color = new Color32(139, 90, 43, 255),
                isEvil = false,
                canBeCreated = true,
                defaultLifespan = 200,
                defaultStrength = 7,
                defaultSpirit = 5,
                defaultMana = 4
            };
            RaceManager.AddRace(earthClan);
            
            // Clan Aire - Rápido, alta magia
            var airClan = new RaceData
            {
                id = CLAN_AIR,
                name = "Windwalker",
                color = new Color32(200, 255, 200, 255),
                isEvil = false,
                canBeCreated = true,
                defaultLifespan = 140,
                defaultStrength = 4,
                defaultSpirit = 7,
                defaultMana = 10
            };
            RaceManager.AddRace(airClan);
        }
    }
}
