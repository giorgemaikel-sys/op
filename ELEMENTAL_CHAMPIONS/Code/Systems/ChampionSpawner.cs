// Sistema de aparición de campeones elementales
using System;
using System.Collections.Generic;
using WorldBoxModLoader;

namespace ElementalChampions.Systems
{
    public static class ChampionSpawner
    {
        private static bool initialized = false;
        private static Dictionary<string, bool> championsSpawned = new Dictionary<string, bool>();
        
        // Lista de campeones disponibles
        private static List<ChampionInfo> champions = new List<ChampionInfo>();
        
        private class ChampionInfo
        {
            public string Element { get; set; }
            public string Name { get; set; }
            public string ActorId { get; set; }
            public string TraitId { get; set; }
            public bool IsSpawned { get; set; }
            
            public ChampionInfo(string element, string name, string actorId, string traitId)
            {
                Element = element;
                Name = name;
                ActorId = actorId;
                TraitId = traitId;
                IsSpawned = false;
            }
        }
        
        public static void Initialize()
        {
            if (initialized) return;
            
            Console.WriteLine("[ChampionSpawner] Inicializando sistema de campeones...");
            
            // Registrar todos los campeones
            champions.Add(new ChampionInfo(
                "fire", 
                "Ignis, el Señor de las Llamas", 
                "ec_actor_champion_fire", 
                "ec_trait_champion_fire"));
            
            champions.Add(new ChampionInfo(
                "water", 
                "Aqualon, el Maestro de las Mareas", 
                "ec_actor_champion_water", 
                "ec_trait_champion_water"));
            
            champions.Add(new ChampionInfo(
                "earth", 
                "Terramax, el Coloso Eterno", 
                "ec_actor_champion_earth", 
                "ec_trait_champion_earth"));
            
            champions.Add(new ChampionInfo(
                "air", 
                "Zephyros, el Viento Viviente", 
                "ec_actor_champion_air", 
                "ec_trait_champion_air"));
            
            champions.Add(new ChampionInfo(
                "lightning", 
                "Fulminax, la Tormenta Encarnada", 
                "ec_actor_champion_lightning", 
                "ec_trait_champion_lightning"));
            
            Console.WriteLine($"[ChampionSpawner] {champions.Count} campeones registrados!");
            foreach(var champ in champions)
            {
                Console.WriteLine($"  - {champ.Name} ({champ.Element})");
            }
            
            initialized = true;
        }
        
        public static void SpawnChampion(string element, int x, int y)
        {
            if (!initialized) Initialize();
            
            var champion = champions.Find(c => c.Element == element && !c.IsSpawned);
            
            if (champion == null)
            {
                if (champions.Find(c => c.Element == element)?.IsSpawned == true)
                    Console.WriteLine($"[ChampionSpawner] {champion.Name} ya ha sido invocado!");
                else
                    Console.WriteLine($"[ChampionSpawner] Campeón de {element} no encontrado!");
                return;
            }
            
            Console.WriteLine($"[ChampionSpawner] ¡Invocando a {champion.Name} en ({x}, {y})!");
            Console.WriteLine($"[ChampionSpawner] Usando actor: {champion.ActorId}");
            Console.WriteLine($"[ChampionSpawner] Asignando trait: {champion.TraitId}");
            
            // Aquí iría el código real para spawnear el actor en WorldBox
            // Spawn.Actor(champion.ActorId, x, y);
            // AddTrait(unitId, champion.TraitId);
            
            champion.IsSpawned = true;
        }
        
        public static void ResetChampions()
        {
            foreach(var champ in champions)
            {
                champ.IsSpawned = false;
            }
            Console.WriteLine("[ChampionSpawner] Todos los campeones reiniciados!");
        }
        
        public static bool IsChampionSpawned(string element)
        {
            var champion = champions.Find(c => c.Element == element);
            return champion?.IsSpawned ?? false;
        }
        
        public static List<ChampionInfo> GetAllChampions() => champions;
    }
}
