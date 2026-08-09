using System;
using WorldBoxAPI;
using WorldBoxAPI.API;
using WorldBoxAPI.API.Data;
using WorldBoxAPI.API.Enums;
using WorldBoxAPI.API.Interfaces;
using ElementalChaos.Core;
using ElementalChaos.Systems;

namespace ElementalChaos
{
    public class Main : IModEntryPoint
    {
        public void OnLoad()
        {
            Console.WriteLine("[Elemental Chaos] Iniciando carga del mod...");
            
            // Registrar sistemas en orden
            ElementalRegistry.Initialize();
            ElementalStats.Register();
            ElementalTraits.Register();
            ElementalHeroes.Register();
            ElementalEffects.Register();
            
            Console.WriteLine("[Elemental Chaos] Mod cargado exitosamente!");
        }
    }
}
