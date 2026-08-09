using System;
using WorldBoxAPI.API;
using WorldBoxAPI.API.Data;
using WorldBoxAPI.API.Enums;

namespace ElementalChaos.Core
{
    public static class ElementalTraits
    {
        public static void Register()
        {
            Console.WriteLine("[ElementalTraits] Registrando traits elementales...");
            
            // Trait Pyromancer - Daño de fuego aumentado
            var pyromancer = new TraitData
            {
                id = ElementalRegistry.TRAIT_PYROMANCER,
                name = "Pyromancer",
                description = "Domina el poder del fuego. Inmune a quemaduras y causa más daño ígneo.",
                icon = "GameResources/traits/pyromancer.png",
                isPositive = true,
                canBeGivenByFate = false,
                inheritableChance = 0.3f
            };
            TraitManager.AddTrait(pyromancer);
            
            // Trait Hydromancer - Curación y defensa acuática
            var hydromancer = new TraitData
            {
                id = ElementalRegistry.TRAIT_HYDROMANCER,
                name = "Hydromancer",
                description = "Maestro del agua. Se cura en el agua y resiste el hielo.",
                icon = "GameResources/traits/hydromancer.png",
                isPositive = true,
                canBeGivenByFate = false,
                inheritableChance = 0.3f
            };
            TraitManager.AddTrait(hydromancer);
            
            // Trait Geomancer - Armadura natural y resistencia
            var geomancer = new TraitData
            {
                id = ElementalRegistry.TRAIT_GEOMANCER,
                name = "Geomancer",
                description = "Señor de la tierra. Armadura natural y resistencia a venenos.",
                icon = "GameResources/traits/geomancer.png",
                isPositive = true,
                canBeGivenByFate = false,
                inheritableChance = 0.3f
            };
            TraitManager.AddTrait(geomancer);
            
            // Trait Aeromancer - Velocidad y evasión
            var aeromancer = new TraitData
            {
                id = ElementalRegistry.TRAIT_AEROMANCER,
                name = "Aeromancer",
                description = "Hijo del viento. Mayor velocidad y probabilidad de esquivar.",
                icon = "GameResources/traits/aeromancer.png",
                isPositive = true,
                canBeGivenByFate = false,
                inheritableChance = 0.3f
            };
            TraitManager.AddTrait(aeromancer);
        }
    }
}
