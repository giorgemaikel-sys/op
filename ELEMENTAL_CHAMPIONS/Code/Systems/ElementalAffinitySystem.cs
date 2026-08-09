// Sistema de afinidad elemental - Mecánicas de juego
using System;
using System.Collections.Generic;
using WorldBoxModLoader;

namespace ElementalChampions.Systems
{
    public static class ElementalAffinitySystem
    {
        // Tabla de fortalezas/debilidades elementales
        // Fuego > Aire > Tierra > Rayo > Agua > Fuego
        private static Dictionary<string, Dictionary<string, float>> affinityMatrix;
        
        private static bool initialized = false;
        
        public static void Initialize()
        {
            if (initialized) return;
            
            Console.WriteLine("[ElementalAffinitySystem] Inicializando sistema de afinidades...");
            
            affinityMatrix = new Dictionary<string, Dictionary<string, float>>();
            
            // Fuego
            affinityMatrix["fire"] = new Dictionary<string, float>();
            affinityMatrix["fire"]["air"] = 1.5f;    // Fuego es fuerte contra Aire
            affinityMatrix["fire"]["water"] = 0.7f;  // Fuego es débil contra Agua
            affinityMatrix["fire"]["earth"] = 1.0f;
            affinityMatrix["fire"]["lightning"] = 1.0f;
            
            // Agua
            affinityMatrix["water"] = new Dictionary<string, float>();
            affinityMatrix["water"]["fire"] = 1.5f;   // Agua es fuerte contra Fuego
            affinityMatrix["water"]["earth"] = 0.8f;  // Agua es ligeramente débil contra Tierra
            affinityMatrix["water"]["air"] = 1.0f;
            affinityMatrix["water"]["lightning"] = 0.7f; // Agua es débil contra Rayo
            
            // Tierra
            affinityMatrix["earth"] = new Dictionary<string, float>();
            affinityMatrix["earth"]["lightning"] = 1.5f; // Tierra es fuerte contra Rayo
            affinityMatrix["earth"]["air"] = 0.8f;       // Tierra es débil contra Aire
            affinityMatrix["earth"]["fire"] = 1.0f;
            affinityMatrix["earth"]["water"] = 1.2f;     // Tierra es ligeramente fuerte contra Agua
            
            // Aire
            affinityMatrix["air"] = new Dictionary<string, float>();
            affinityMatrix["air"]["earth"] = 1.5f;   // Aire es fuerte contra Tierra
            affinityMatrix["air"]["lightning"] = 0.9f; // Aire es ligeramente débil contra Rayo
            affinityMatrix["air"]["fire"] = 0.7f;    // Aire es débil contra Fuego
            affinityMatrix["air"]["water"] = 1.0f;
            
            // Rayo
            affinityMatrix["lightning"] = new Dictionary<string, float>();
            affinityMatrix["lightning"]["water"] = 1.5f;  // Rayo es fuerte contra Agua
            affinityMatrix["lightning"]["earth"] = 0.7f;  // Rayo es débil contra Tierra
            affinityMatrix["lightning"]["fire"] = 1.0f;
            affinityMatrix["lightning"]["air"] = 1.1f;    // Rayo es ligeramente fuerte contra Aire
            
            initialized = true;
            Console.WriteLine("[ElementalAffinitySystem] Matriz de afinidades configurada!");
            PrintAffinityMatrix();
        }
        
        private static void PrintAffinityMatrix()
        {
            Console.WriteLine("[ElementalAffinitySystem] Matriz de efectividad:");
            foreach(var attacker in affinityMatrix)
            {
                string line = $"  {attacker.Key}: ";
                foreach(var defender in attacker.Value)
                {
                    if(defender.Value > 1.0f)
                        line += $"+{defender.Key}({defender.Value}) ";
                    else if(defender.Value < 1.0f)
                        line += $"-{defender.Key}({defender.Value}) ";
                }
                Console.WriteLine(line);
            }
        }
        
        public static float GetDamageMultiplier(string attackerElement, string defenderElement)
        {
            if (!initialized) Initialize();
            
            if (!affinityMatrix.ContainsKey(attackerElement))
                return 1.0f;
            
            if (!affinityMatrix[attackerElement].ContainsKey(defenderElement))
                return 1.0f;
            
            return affinityMatrix[attackerElement][defenderElement];
        }
        
        public static void OnTick()
        {
            // Aquí iría la lógica que se ejecuta en cada tick del juego
            // Por ejemplo: aplicar efectos de ambiente, regeneración elemental, etc.
        }
        
        public static bool HasAffinity(string unitId, string element)
        {
            // Verifica si una unidad tiene afinidad con un elemento
            // Esto se implementaría leyendo los traits de la unidad
            return true; // Placeholder
        }
    }
}
