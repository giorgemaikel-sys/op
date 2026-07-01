// NarutoCombatLibrary.cpp
#include "NarutoCombatTypes.h"
#include "Math/UnrealMathUtility.h"

float UNarutoCombatLibrary::CalculateElementalMultiplier(EChakraNature AttackerNature, EChakraNature DefenderNature, bool bIsSpecialChakra)
{
	// Si es chakra especial (Amaterasu, Six Paths, etc.), reduce la efectividad de las debilidades
	if (bIsSpecialChakra)
	{
		// El chakra especial ignora parcialmente las desventajas elementales
		// Amaterasu vs Agua: en lugar de 0.5x, será 0.75x
	}

	// Sistema Piedra-Papel-Tijera Elemental
	// Fuego > Viento > Rayo > Tierra > Agua > Fuego
	if (AttackerNature == DefenderNature)
	{
		return 1.0f; // Mismo elemento: daño neutral
	}

	switch (AttackerNature)
	{
	case EChakraNature::Fire:
		if (DefenderNature == EChakraNature::Wind) return 2.0f;  // Fuego quema Viento
		if (DefenderNature == EChakraNature::Water) return 0.5f; // Agua apaga Fuego
		break;

	case EChakraNature::Wind:
		if (DefenderNature == EChakraNature::Lightning) return 2.0f; // Viento dispersa Rayo
		if (DefenderNature == EChakraNature::Fire) return 0.5f;      // Fuego consume Viento
		break;

	case EChakraNature::Lightning:
		if (DefenderNature == EChakraNature::Earth) return 2.0f;  // Rayo penetra Tierra
		if (DefenderNature == EChakraNature::Wind) return 0.5f;   // Viento dispersa Rayo
		break;

	case EChakraNature::Earth:
		if (DefenderNature == EChakraNature::Water) return 2.0f;  // Tierra absorbe Agua
		if (DefenderNature == EChakraNature::Lightning) return 0.5f; // Rayo penetra Tierra
		break;

	case EChakraNature::Water:
		if (DefenderNature == EChakraNature::Fire) return 2.0f;   // Agua apaga Fuego
		if (DefenderNature == EChakraNature::Earth) return 0.5f;  // Tierra absorbe Agua
		break;

	// Kekkei Genkai y otros elementos especiales
	case EChakraNature::Ice: // Agua + Viento
		if (DefenderNature == EChakraNature::Fire) return 1.5f; // Hielo resiste mejor al fuego
		if (DefenderNature == EChakraNature::Earth) return 1.2f;
		break;

	case EChakraNature::Wood: // Agua + Tierra
		if (DefenderNature == EChakraNature::Fire) return 0.75f; // Madera vulnerable pero resistente
		if (DefenderNature == EChakraNature::Lightning) return 0.5f; // Rayo es debilidad crítica de Madera
		break;

	case EChakraNature::Lava: // Fuego + Tierra
		if (DefenderNature == EChakraNature::Water) return 0.75f; // Lava se enfría pero no se anula completamente
		if (DefenderNature == EChakraNature::Wind) return 1.5f;
		break;

	default:
		break;
	}

	// Si es chakra especial y hay desventaja, mitigarla
	if (bIsSpecialChakra)
	{
		// Verificar si íbamos a retornar 0.5 (desventaja)
		// En ese caso, retornamos 0.75 en su lugar
		// Esto ya se maneja arriba en los casos específicos si se desea
	}

	return 1.0f; // Neutral por defecto
}

float UNarutoCombatLibrary::CalculateFinalDamage(const FJutsuData& Jutsu, float AttackerControl, bool bIsSageMode, float DefenderResistance)
{
	// Fórmula base: DañoBase * (Control/100) * MultiplicadorElemental * (1 - Resistencia/100)
	
	float ControlMultiplier = FMath::Clamp(AttackerControl / 100.0f, 0.3f, 1.5f);
	
	// Bonus por rango de Jutsu
	float RankMultiplier = 1.0f;
	switch (Jutsu.Rank)
	{
	case EJutsuRank::E_Rank: RankMultiplier = 0.5f; break;
	case EJutsuRank::D_Rank: RankMultiplier = 0.7f; break;
	case EJutsuRank::C_Rank: RankMultiplier = 1.0f; break;
	case EJutsuRank::B_Rank: RankMultiplier = 1.3f; break;
	case EJutsuRank::A_Rank: RankMultiplier = 1.6f; break;
	case EJutsuRank::S_Rank: RankMultiplier = 2.0f; break;
	}

	// Modo Sabio: bonus significativo
	float SageMultiplier = bIsSageMode ? 1.5f : 1.0f;

	// Calcular multiplicador elemental (asumiendo que el defensor tiene una naturaleza por defecto o se pasa como parámetro adicional)
	// Para este ejemplo, usamos 1.0 como base. En producción, se pasaría EChakraNature DefenderNature
	float ElementalMultiplier = 1.0f; 

	// Daño final
	float FinalDamage = Jutsu.BaseDamage * RankMultiplier * ControlMultiplier * SageMultiplier * ElementalMultiplier;

	// Aplicar resistencia del defensor
	FinalDamage *= (1.0f - FMath::Clamp(DefenderResistance / 100.0f, 0.0f, 0.9f));

	// Bonus especial para Susanoo por etapa
	if (Jutsu.SusanooStage > 0)
	{
		float SusanooBonus = 1.0f + (Jutsu.SusanooStage * 0.4f); // +40% por etapa
		FinalDamage *= SusanooBonus;
	}

	return FMath::Max(FinalDamage, 1.0f); // Mínimo 1 de daño
}
