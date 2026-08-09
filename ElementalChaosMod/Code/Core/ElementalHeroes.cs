using System;
using WorldBoxAPI.API;
using WorldBoxAPI.API.Data;
using WorldBoxAPI.API.Enums;

namespace ElementalChaos.Core
{
    public static class ElementalHeroes
    {
        public static void Register()
        {
            Console.WriteLine("[ElementalHeroes] Registrando héroes elementales...");
            
            // Héroe de Fuego - Inferno
            var inferno = new ActorData
            {
                id = ElementalRegistry.HERO_INFERNO,
                name = "Inferno",
                raceId = ElementalRegistry.CLAN_FIRE,
                gender = Gender.Male,
                age = 25,
                strength = 15,
                spirit = 8,
                mana = 12,
                health = 200,
                traits = new[] { ElementalRegistry.TRAIT_PYROMANCER },
                sprite = "GameResources/heroes/inferno.png",
                description = "El Señor del Fuego Eterno. Su ira consume todo a su paso."
            };
            ActorManager.AddHero(inferno);
            
            // Héroe de Agua - Tidal
            var tidal = new ActorData
            {
                id = ElementalRegistry.HERO_TIDAL,
                name = "Tidal",
                raceId = ElementalRegistry.CLAN_WATER,
                gender = Gender.Female,
                age = 30,
                strength = 10,
                spirit = 16,
                mana = 14,
                health = 180,
                traits = new[] { ElementalRegistry.TRAIT_HYDROMANCER },
                sprite = "GameResources/heroes/tidal.png",
                description = "La Guardiana de las Mareas. Controla los océanos con su voluntad."
            };
            ActorManager.AddHero(tidal);
            
            // Héroe de Tierra - Terra
            var terra = new ActorData
            {
                id = ElementalRegistry.HERO_TERRA,
                name = "Terra",
                raceId = ElementalRegistry.CLAN_EARTH,
                gender = Gender.Female,
                age = 50,
                strength = 14,
                spirit = 10,
                mana = 8,
                health = 250,
                traits = new[] { ElementalRegistry.TRAIT_GEOMANCER },
                sprite = "GameResources/heroes/terra.png",
                description = "La Montaña Viviente. Inamovible y poderosa como la tierra misma."
            };
            ActorManager.AddHero(terra);
            
            // Héroe de Aire - Zephyr
            var zephyr = new ActorData
            {
                id = ElementalRegistry.HERO_ZEPHYR,
                name = "Zephyr",
                raceId = ElementalRegistry.CLAN_AIR,
                gender = Gender.Male,
                age = 22,
                strength = 8,
                spirit = 12,
                mana = 18,
                health = 150,
                traits = new[] { ElementalRegistry.TRAIT_AEROMANCER },
                sprite = "GameResources/heroes/zephyr.png",
                description = "El Mensajero de los Vientos. Rápido como una tormenta y libre como la brisa."
            };
            ActorManager.AddHero(zephyr);
        }
    }
}
