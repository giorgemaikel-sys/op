// Sistema de traits (rasgos) elementales
using System;
using WorldBoxModLoader;

namespace ElementalChampions.Content
{
    public static class ECTraits
    {
        // Traits de afinidad elemental
        public static void RegisterAll()
        {
            Console.WriteLine("[ECTraits] Registrando traits elementales...");
            
            // FIRE TRAITS
            RegisterTrait("ec_trait_flame_soul", "Alma de Fuego", 
                "Aumenta el daño de fuego en 50%. Inmune a quemaduras.", 
                "icons/traits/flame_soul.png", isPositive: true);
            
            RegisterTrait("ec_trait_pyromancer", "Piromante", 
                "Puede lanzar bolas de fuego. +30% ataque.", 
                "icons/traits/pyromancer.png", isPositive: true);
            
            // WATER TRAITS
            RegisterTrait("ec_trait_aqua_soul", "Alma de Agua", 
                "Aumenta la regeneración en agua. Inmune a ahogamiento.", 
                "icons/traits/aqua_soul.png", isPositive: true);
            
            RegisterTrait("ec_trait_hydromancer", "Hidromante", 
                "Puede curar aliados con agua. +25% defensa.", 
                "icons/traits/hydromancer.png", isPositive: true);
            
            // EARTH TRAITS
            RegisterTrait("ec_trait_stone_soul", "Alma de Tierra", 
                "+50% defensa. Inmune a veneno.", 
                "icons/traits/stone_soul.png", isPositive: true);
            
            RegisterTrait("ec_trait_geomancer", "Geomante", 
                "Puede crear muros de piedra. +40% vida.", 
                "icons/traits/geomancer.png", isPositive: true);
            
            // AIR TRAITS
            RegisterTrait("ec_trait_wind_soul", "Alma de Aire", 
                "+30% velocidad. Inmune a caídas.", 
                "icons/traits/wind_soul.png", isPositive: true);
            
            RegisterTrait("ec_trait_aeromancer", "Aeromante", 
                "Puede volar temporalmente. +20% esquive.", 
                "icons/traits/aeromancer.png", isPositive: true);
            
            // LIGHTNING TRAITS
            RegisterTrait("ec_trait_storm_soul", "Alma de Rayo", 
                "Ataques eléctricos críticos. Inmune a parálisis.", 
                "icons/traits/storm_soul.png", isPositive: true);
            
            RegisterTrait("ec_trait_fulgurmage", "Fulgurmagus", 
                "Puede lanzar rayos. +50% velocidad de ataque.", 
                "icons/traits/fulgurmage.png", isPositive: true);
            
            // CHAMPION TRAITS (Únicos)
            RegisterTrait("ec_trait_champion_fire", "Campeón del Fuego", 
                "Líder legendario del clan de fuego. Habilidades devastadoras.", 
                "icons/traits/champion_fire.png", isPositive: true, isUnique: true);
            
            RegisterTrait("ec_trait_champion_water", "Campeón del Agua", 
                "Líder legendario del clan de agua. Maestría en curación.", 
                "icons/traits/champion_water.png", isPositive: true, isUnique: true);
            
            RegisterTrait("ec_trait_champion_earth", "Campeón de la Tierra", 
                "Líder legendario del clan de tierra. Defensas impenetrables.", 
                "icons/traits/champion_earth.png", isPositive: true, isUnique: true);
            
            RegisterTrait("ec_trait_champion_air", "Campeón del Aire", 
                "Líder legendario del clan de aire. Velocidad incomparable.", 
                "icons/traits/champion_air.png", isPositive: true, isUnique: true);
            
            RegisterTrait("ec_trait_champion_lightning", "Campeón del Rayo", 
                "Líder legendario del clan de rayo. Poder destructivo total.", 
                "icons/traits/champion_lightning.png", isPositive: true, isUnique: true);
            
            Console.WriteLine("[ECTraits] Traits registrados exitosamente!");
        }
        
        private static void RegisterTrait(string id, string name, string description, string iconPath, bool isPositive = true, bool isUnique = false)
        {
            Core.ECRegistry.RegisterTrait(id.Replace("ec_trait_", ""));
            Console.WriteLine($"  - {name}: {description}");
        }
    }
}
