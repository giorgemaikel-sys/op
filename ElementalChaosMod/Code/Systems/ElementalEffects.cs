using System;
using WorldBoxAPI.API;
using WorldBoxAPI.API.Data;

namespace ElementalChaos.Systems
{
    public static class ElementalEffects
    {
        public static void Register()
        {
            Console.WriteLine("[ElementalEffects] Registrando efectos elementales...");
            
            // Efecto Burn - Daño por fuego continuo
            var burn = new EffectData
            {
                id = ElementalRegistry.EFFECT_BURN,
                name = "Burning",
                description = "Arde con fuego mágico. Causa daño continuo.",
                icon = "GameResources/effects/burn.png",
                duration = 5,
                damagePerTick = 3,
                isDebuff = true
            };
            EffectManager.AddEffect(burn);
            
            // Efecto Freeze - Congelamiento que ralentiza
            var freeze = new EffectData
            {
                id = ElementalRegistry.EFFECT_FREEZE,
                name = "Frozen",
                description = "Congelado en hielo. Movimiento y ataque reducidos.",
                icon = "GameResources/effects/freeze.png",
                duration = 4,
                speedModifier = -0.5f,
                isDebuff = true
            };
            EffectManager.AddEffect(freeze);
            
            // Efecto Root - Inmovilización terrestre
            var root = new EffectData
            {
                id = ElementalRegistry.EFFECT_ROOT,
                name = "Rooted",
                description = "Atrapado por raíces de tierra. No puede moverse.",
                icon = "GameResources/effects/root.png",
                duration = 3,
                immobilize = true,
                isDebuff = true
            };
            EffectManager.AddEffect(root);
            
            // Efecto Storm - Daño eléctrico aleatorio
            var storm = new EffectData
            {
                id = ElementalRegistry.EFFECT_STORM,
                name = "Storm Struck",
                description = "Golpeado por rayos. Daño eléctrico aleatorio.",
                icon = "GameResources/effects/storm.png",
                duration = 6,
                damagePerTick = 2,
                isDebuff = true
            };
            EffectManager.AddEffect(storm);
        }
    }
}
