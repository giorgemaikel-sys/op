// Punto de entrada del mod Elemental Champions
using System;
using WorldBoxModLoader;

namespace ElementalChampions
{
    public class Main : IMod
    {
        public void OnLoad()
        {
            Console.WriteLine("[Elemental Champions] Iniciando carga del mod...");
            
            // Cargar sistemas en orden
            Core.ECRegistry.RegisterAll();
            Content.ECTraits.RegisterAll();
            Content.ECEffects.RegisterAll();
            Content.ECActors.RegisterAll();
            Systems.ElementalAffinitySystem.Initialize();
            Systems.ChampionSpawner.Initialize();
            
            Console.WriteLine("[Elemental Champions] Mod cargado exitosamente!");
        }
        
        public void OnTick()
        {
            Systems.ElementalAffinitySystem.OnTick();
        }
        
        public void OnUnload()
        {
            Console.WriteLine("[Elemental Champions] Mod descargado.");
        }
    }
}
