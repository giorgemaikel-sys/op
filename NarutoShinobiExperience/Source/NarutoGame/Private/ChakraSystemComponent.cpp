// ChakraSystemComponent.cpp
#include "ChakraSystemComponent.h"
#include "Math/UnrealMathUtility.h"
#include "Net/UnrealNetwork.h"

UChakraSystemComponent::UChakraSystemComponent()
{
	PrimaryComponentTick.bCanEverTick = true;

	// Valores iniciales
	SageModeState = ESageModeState::Inactive;
	PrimaryNature = EChakraNature::None;
	bHasKekkeiGenkai = false;
	KekkeiGenkaiNature = EChakraNature::None;

	// Configuración del Modo Sabio
	MinGatheringTime = 3.0f; // 3 segundos mínimo para recolectar
	NaturalEnergyGatherRate = 10.0f; // 10 puntos por segundo
	bIsGathering = false;
	AccumulatedGatherTime = 0.0f;
}

void UChakraSystemComponent::BeginPlay()
{
	Super::BeginPlay();

	// Inicializar con la naturaleza primaria desbloqueada
	if (PrimaryNature != EChakraNature::None)
	{
		UnlockedNatures.Add(PrimaryNature);
	}

	// Si tiene Kekkei Genkai, desbloquearla también
	if (bHasKekkeiGenkai && KekkeiGenkaiNature != EChakraNature::None)
	{
		UnlockedNatures.Add(KekkeiGenkaiNature);
	}
}

void UChakraSystemComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
	Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

	// Regeneración pasiva de chakra
	RegenerateChakra(DeltaTime);

	// Si está recolectando energía natural, verificar si sigue inmóvil
	if (bIsGathering)
	{
		// En producción, aquí se verificaría si el personaje está realmente inmóvil
		// Por ahora, asumimos que sí y acumulamos tiempo
		AccumulatedGatherTime += DeltaTime;

		// Añadir energía natural gradualmente
		AddNaturalEnergy(NaturalEnergyGatherRate * DeltaTime);
	}

	// Verificar estado de petrificación continuamente
	if (SageModeState == ESageModeState::Unstable_High || SageModeState == ESageModeState::Active)
	{
		CheckPetrification();
	}
}

// ===================================================================
// FUNCIONES DE GESTIÓN DE CHAKRA
// ===================================================================

void UChakraSystemComponent::AddPhysicalChakra(float Amount)
{
	float OldValue = ChakraLevels.Physical;
	ChakraLevels.Physical = FMath::Clamp(ChakraLevels.Physical + Amount, 0.0f, ChakraLevels.MaxPhysical);
	
	if (FMath::Abs(ChakraLevels.Physical - OldValue) > 0.01f)
	{
		OnPhysicalChakraChanged.Broadcast(ChakraLevels.Physical, ChakraLevels.MaxPhysical);
		UpdateSageModeState();
	}
}

void UChakraSystemComponent::AddSpiritualChakra(float Amount)
{
	float OldValue = ChakraLevels.Spiritual;
	ChakraLevels.Spiritual = FMath::Clamp(ChakraLevels.Spiritual + Amount, 0.0f, ChakraLevels.MaxSpiritual);
	
	if (FMath::Abs(ChakraLevels.Spiritual - OldValue) > 0.01f)
	{
		OnSpiritualChakraChanged.Broadcast(ChakraLevels.Spiritual, ChakraLevels.MaxSpiritual);
		UpdateSageModeState();
	}
}

void UChakraSystemComponent::AddNaturalEnergy(float Amount)
{
	float OldValue = ChakraLevels.Natural;
	ChakraLevels.Natural = FMath::Clamp(ChakraLevels.Natural + Amount, 0.0f, ChakraLevels.MaxNatural);
	
	if (FMath::Abs(ChakraLevels.Natural - OldValue) > 0.01f)
	{
		OnNaturalEnergyChanged.Broadcast(ChakraLevels.Natural, ChakraLevels.MaxNatural);
		UpdateSageModeState();
	}
}

bool UChakraSystemComponent::ConsumeChakraForJutsu(float SpiritualCost, float PhysicalCost)
{
	// Verificar si hay suficiente chakra
	if (ChakraLevels.Spiritual < SpiritualCost || ChakraLevels.Physical < PhysicalCost)
	{
		return false; // No hay suficiente chakra
	}

	// Consumir chakra
	ChakraLevels.Spiritual -= SpiritualCost;
	ChakraLevels.Physical -= PhysicalCost;

	// Disparar eventos
	OnSpiritualChakraChanged.Broadcast(ChakraLevels.Spiritual, ChakraLevels.MaxSpiritual);
	OnPhysicalChakraChanged.Broadcast(ChakraLevels.Physical, ChakraLevels.MaxPhysical);

	UpdateSageModeState();

	return true;
}

void UChakraSystemComponent::RegenerateChakra(float DeltaTime)
{
	// Tasas de regeneración base (pueden modificarse con perks, objetos, etc.)
	const float PhysicalRegenRate = 5.0f; // 5 puntos por segundo
	const float SpiritualRegenRate = 3.0f; // 3 puntos por segundo

	// La regeneración se ve afectada por el Control de Chakra
	float ControlMultiplier = ChakraLevels.ControlPercentage / 100.0f;

	// Modo Sabio aumenta la regeneración
	float SageMultiplier = IsPerfectSageMode() ? 2.0f : 1.0f;

	// Regenerar (solo si no está en estado Petrified)
	if (SageModeState != ESageModeState::Petrified)
	{
		AddPhysicalChakra(PhysicalRegenRate * ControlMultiplier * SageMultiplier * DeltaTime);
		AddSpiritualChakra(SpiritualRegenRate * ControlMultiplier * SageMultiplier * DeltaTime);
	}
}

// ===================================================================
// SISTEMA DE MODO SABIO
// ===================================================================

void UChakraSystemComponent::StartGatheringNaturalEnergy()
{
	if (SageModeState == ESageModeState::Active)
	{
		// Ya está en Modo Sabio, no necesita recolectar
		return;
	}

	if (SageModeState == ESageModeState::Petrified)
	{
		// Está petrificado, no puede recolectar
		return;
	}

	bIsGathering = true;
	AccumulatedGatherTime = 0.0f;
	SageModeState = ESageModeState::Gathering;
	OnSageModeStateChanged.Broadcast(SageModeState);
}

void UChakraSystemComponent::StopGatheringAndEvaluate()
{
	bIsGathering = false;

	// Evaluar si ha acumulado suficiente tiempo y energía
	if (AccumulatedGatherTime >= MinGatheringTime)
	{
		// Intentar activar Modo Sabio
		ActivateSageMode();
	}
	else
	{
		// No hubo suficiente tiempo, volver a inactivo
		SageModeState = ESageModeState::Inactive;
		OnSageModeStateChanged.Broadcast(SageModeState);
	}

	AccumulatedGatherTime = 0.0f;
}

bool UChakraSystemComponent::ActivateSageMode()
{
	float Balance = GetSageBalancePercentage();

	// Verificar equilibrio (necesita al menos 90% de balance perfecto)
	if (Balance >= 90.0f)
	{
		SageModeState = ESageModeState::Active;
		OnSageModeStateChanged.Broadcast(SageModeState);
		return true;
	}
	else if (ChakraLevels.Natural < ChakraLevels.Physical || ChakraLevels.Natural < ChakraLevels.Spiritual)
	{
		// Muy poca energía natural
		SageModeState = ESageModeState::Unstable_Low;
		OnSageModeStateChanged.Broadcast(SageModeState);
		return false;
	}
	else
	{
		// Demasiada energía natural (peligro de petrificación)
		SageModeState = ESageModeState::Unstable_High;
		OnSageModeStateChanged.Broadcast(SageModeState);
		return false;
	}
}

void UChakraSystemComponent::DeactivateSageMode()
{
	SageModeState = ESageModeState::Inactive;
	
	// Resetear energía natural parcialmente (pierde el exceso)
	ChakraLevels.Natural = 0.0f;
	
	OnSageModeStateChanged.Broadcast(SageModeState);
	OnNaturalEnergyChanged.Broadcast(ChakraLevels.Natural, ChakraLevels.MaxNatural);
}

bool UChakraSystemComponent::IsPerfectSageMode() const
{
	return SageModeState == ESageModeState::Active;
}

float UChakraSystemComponent::GetSageBalancePercentage() const
{
	return ChakraLevels.GetSageBalance();
}

// ===================================================================
// SISTEMA DE CONTROL DE CHAKRA
// ===================================================================

void UChakraSystemComponent::IncreaseChakraControl(float Amount)
{
	ChakraLevels.ControlPercentage = FMath::Clamp(ChakraLevels.ControlPercentage + Amount, 0.0f, 100.0f);
}

float UChakraSystemComponent::GetChakraControlPercentage() const
{
	return ChakraLevels.ControlPercentage;
}

float UChakraSystemComponent::GetJutsuSuccessProbability(const FJutsuData& Jutsu) const
{
	// Fórmula: Control% - (RangoDelJutsu * Factor)
	// Jutsus de mayor rango son más difíciles de ejecutar con bajo control
	
	float RankDifficulty = 0.0f;
	switch (Jutsu.Rank)
	{
	case EJutsuRank::E_Rank: RankDifficulty = 0.0f; break;
	case EJutsuRank::D_Rank: RankDifficulty = 5.0f; break;
	case EJutsuRank::C_Rank: RankDifficulty = 10.0f; break;
	case EJutsuRank::B_Rank: RankDifficulty = 20.0f; break;
	case EJutsuRank::A_Rank: RankDifficulty = 35.0f; break;
	case EJutsuRank::S_Rank: RankDifficulty = 50.0f; break;
	}

	// Bonus si tiene la naturaleza adecuada
	float NatureBonus = HasNature(Jutsu.PrimaryNature) ? 10.0f : 0.0f;

	// Bonus si está en Modo Sabio
	float SageBonus = IsPerfectSageMode() ? 15.0f : 0.0f;

	float Probability = ChakraLevels.ControlPercentage + NatureBonus + SageBonus - RankDifficulty;

	return FMath::Clamp(Probability, 0.0f, 100.0f);
}

// ===================================================================
// SISTEMA DE SELLOS MANUALES
// ===================================================================

void UChakraSystemComponent::PerformHandSeal(EHandSeal Seal)
{
	CurrentSealSequence.Add(Seal);
}

bool UChakraSystemComponent::ExecuteJutsuIfSequenceMatches(const FJutsuData& Jutsu)
{
	// Verificar si la secuencia actual coincide con la del Jutsu
	if (CurrentSealSequence.Num() != Jutsu.SealSequence.Num())
	{
		ClearSealSequence();
		return false;
	}

	// Comparar cada sello
	for (int32 i = 0; i < CurrentSealSequence.Num(); ++i)
	{
		if (CurrentSealSequence[i] != Jutsu.SealSequence[i])
		{
			ClearSealSequence();
			return false;
		}
	}

	// Verificar probabilidad de éxito
	float SuccessChance = GetJutsuSuccessProbability(Jutsu);
	float Roll = FMath::FRandRange(0.0f, 100.0f);

	if (Roll <= SuccessChance)
	{
		// Éxito: consumir chakra y limpiar secuencia
		bool bConsumed = ConsumeChakraForJutsu(Jutsu.ChakraCost, 0.0f);
		ClearSealSequence();
		return bConsumed;
	}
	else
	{
		// Fallo: retroceso de chakra
		float BacklashDamage = CalculateChakraBacklashDamage(Jutsu);
		AddPhysicalChakra(-BacklashDamage); // Daño al chakra físico/HP
		ClearSealSequence();
		return false;
	}
}

void UChakraSystemComponent::ClearSealSequence()
{
	CurrentSealSequence.Empty();
}

// ===================================================================
// UTILIDADES
// ===================================================================

bool UChakraSystemComponent::HasNature(EChakraNature Nature) const
{
	return UnlockedNatures.Contains(Nature);
}

float UChakraSystemComponent::CalculateChakraBacklashDamage(const FJutsuData& Jutsu) const
{
	// El retroceso es proporcional al costo y rango del Jutsu fallido
	float RankMultiplier = 1.0f;
	switch (Jutsu.Rank)
	{
	case EJutsuRank::E_Rank: RankMultiplier = 0.5f; break;
	case EJutsuRank::D_Rank: RankMultiplier = 0.7f; break;
	case EJutsuRank::C_Rank: RankMultiplier = 1.0f; break;
	case EJutsuRank::B_Rank: RankMultiplier = 1.5f; break;
	case EJutsuRank::A_Rank: RankMultiplier = 2.0f; break;
	case EJutsuRank::S_Rank: RankMultiplier = 3.0f; break;
	}

	return Jutsu.ChakraCost * RankMultiplier * 0.5f; // 50% del costo como daño
}

// ===================================================================
// FUNCIONES INTERNAS
// ===================================================================

void UChakraSystemComponent::UpdateSageModeState()
{
	// Solo actualizar si está en un estado relacionado con el Modo Sabio
	if (SageModeState == ESageModeState::Inactive || 
		SageModeState == ESageModeState::Gathering ||
		SageModeState == ESageModeState::Petrified)
	{
		return;
	}

	// Recalcular estado basado en los niveles actuales
	float Balance = GetSageBalancePercentage();

	if (SageModeState == ESageModeState::Active)
	{
		// Verificar si mantiene el equilibrio
		if (Balance < 70.0f)
		{
			// Perdió el equilibrio, desactivar Modo Sabio
			DeactivateSageMode();
		}
	}
	else if (SageModeState == ESageModeState::Unstable_High)
	{
		// Verificar si empeora hacia petrificación
		CheckPetrification();
	}
}

void UChakraSystemComponent::CheckPetrification()
{
	// Si la Energía Natural supera el 90% del total y no está en equilibrio perfecto
	float TotalChakra = ChakraLevels.Physical + ChakraLevels.Spiritual + ChakraLevels.Natural;
	if (TotalChakra <= 0) return;

	float NaturalPercentage = (ChakraLevels.Natural / TotalChakra) * 100.0f;

	// Umbral de peligro: más del 60% es energía natural sin equilibrio
	if (NaturalPercentage > 60.0f && !IsPerfectSageMode())
	{
		// Acercándose a la petrificación
		if (NaturalPercentage > 85.0f)
		{
			// Estado crítico
			SageModeState = ESageModeState::Unstable_High;
			OnSageModeStateChanged.Broadcast(SageModeState);
		}

		// Verificar petrificación instantánea
		if (NaturalPercentage > 95.0f)
		{
			SageModeState = ESageModeState::Petrified;
			OnSageModeStateChanged.Broadcast(SageModeState);
			OnPetrified.Broadcast(); // Game Over event
		}
	}
}
