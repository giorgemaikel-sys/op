// Sistema de registro centralizado para Elemental Champions
using System;
using System.Collections.Generic;
using WorldBoxModLoader;

namespace ElementalChampions.Core
{
    public static class ECRegistry
    {
        // Prefijo único para evitar conflictos
        public const string PREFIX = "ec_";
        
        // Listas de registros
        private static List<string> registeredClans = new List<string>();
        private static List<string> registeredTraits = new List<string>();
        private static List<string> registeredEffects = new List<string>();
        private static List<string> registeredActors = new List<string>();
        private static List<string> registeredItems = new List<string>();
        
        // Elementos disponibles
        public enum Element
        {
            Fire,   // Fuego
            Water,  // Agua
            Earth,  // Tierra
            Air,    // Aire
            Lightning // Rayo
        }
        
        public static string GetElementName(Element e)
        {
            switch(e)
            {
                case Element.Fire: return "Fuego";
                case Element.Water: return "Agua";
                case Element.Earth: return "Tierra";
                case Element.Air: return "Aire";
                case Element.Lightning: return "Rayo";
                default: return "Desconocido";
            }
        }
        
        public static string GetElementColor(Element e)
        {
            switch(e)
            {
                case Element.Fire: return "#FF4500";
                case Element.Water: return "#1E90FF";
                case Element.Earth: return "#8B4513";
                case Element.Air: return "#87CEEB";
                case Element.Lightning: return "#FFD700";
                default: return "#FFFFFF";
            }
        }
        
        public static void RegisterClan(string id)
        {
            string fullId = PREFIX + "clan_" + id;
            registeredClans.Add(fullId);
            Console.WriteLine($"[ECRegistry] Clan registrado: {fullId}");
        }
        
        public static void RegisterTrait(string id)
        {
            string fullId = PREFIX + "trait_" + id;
            registeredTraits.Add(fullId);
            Console.WriteLine($"[ECRegistry] Trait registrado: {fullId}");
        }
        
        public static void RegisterEffect(string id)
        {
            string fullId = PREFIX + "effect_" + id;
            registeredEffects.Add(fullId);
            Console.WriteLine($"[ECRegistry] Efecto registrado: {fullId}");
        }
        
        public static void RegisterActor(string id)
        {
            string fullId = PREFIX + "actor_" + id;
            registeredActors.Add(fullId);
            Console.WriteLine($"[ECRegistry] Actor registrado: {fullId}");
        }
        
        public static void RegisterItem(string id)
        {
            string fullId = PREFIX + "item_" + id;
            registeredItems.Add(fullId);
            Console.WriteLine($"[ECRegistry] Item registrado: {fullId}");
        }
        
        public static void RegisterAll()
        {
            Console.WriteLine("[ECRegistry] Registrando todos los elementos de Elemental Champions...");
            
            // Registrar clanes elementales
            RegisterClan("fire");
            RegisterClan("water");
            RegisterClan("earth");
            RegisterClan("air");
            RegisterClan("lightning");
            
            Console.WriteLine($"[ECRegistry] Total clanes: {registeredClans.Count}");
            Console.WriteLine($"[ECRegistry] Total traits: {registeredTraits.Count}");
            Console.WriteLine($"[ECRegistry] Total efectos: {registeredEffects.Count}");
            Console.WriteLine($"[ECRegistry] Total actores: {registeredActors.Count}");
            Console.WriteLine($"[ECRegistry] Total items: {registeredItems.Count}");
        }
        
        public static List<string> GetRegisteredClans() => registeredClans;
        public static List<string> GetRegisteredTraits() => registeredTraits;
        public static List<string> GetRegisteredEffects() => registeredEffects;
        public static List<string> GetRegisteredActors() => registeredActors;
        public static List<string> GetRegisteredItems() => registeredItems;
    }
}
