// ChakraSystemComponent.h
#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "NarutoCombatTypes.h"
#include "ChakraSystemComponent.generated.h"

// Delegados para eventos de chakra
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnChakraChanged, float, CurrentValue, float, MaxValue);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSageModeStateChanged, ESageModeState, NewState);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnChakraNatureUnlocked, EChakraNature, Nature);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnPetrified); // Game Over state

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class NARUTO_GAME_API UChakraSystemComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UChakraSystemComponent();

protected:
	virtual void BeginPlay() override;

public:
	virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

	// ===================================================================
	// PROPIEDADES PRINCIPALES
	// ===================================================================

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chakra|Levels")
	FChakraLevels ChakraLevels;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chakra|Levels")
	ESageModeState SageModeState;

	// Naturalezas de chakra desbloqueadas por el personaje
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chakra|Natures")
	TArray<EChakraNature> UnlockedNatures;

	// Naturaleza primaria (afecta bonus pasivos)
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chakra|Natures")
	EChakraNature PrimaryNature;

	// ¿Tiene Kekkei Genkai?
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chakra|Natures")
	bool bHasKekkeiGenkai;

	// Si tiene Kekkei Genkai, cuál es
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chakra|Natures")
	EChakraNature KekkeiGenkaiNature;

	// ===================================================================
	// EVENTOS (Delegados)
	// ===================================================================

	UPROPERTY(BlueprintAssignable, Category = "Chakra|Events")
	FOnChakraChanged OnPhysicalChakraChanged;

	UPROPERTY(BlueprintAssignable, Category = "Chakra|Events")
	FOnChakraChanged OnSpiritualChakraChanged;

	UPROPERTY(BlueprintAssignable, Category = "Chakra|Events")
	FOnChakraChanged OnNaturalEnergyChanged;

	UPROPERTY(BlueprintAssignable, Category = "Chakra|Events")
	FOnSageModeStateChanged OnSageModeStateChanged;

	UPROPERTY(BlueprintAssignable, Category = "Chakra|Events")
	FOnPetrified OnPetrified;

	// ===================================================================
	// FUNCIONES DE GESTIÓN DE CHAKRA
	// ===================================================================

	// Modificadores de energía
	UFUNCTION(BlueprintCallable, Category = "Chakra|Management")
	void AddPhysicalChakra(float Amount);

	UFUNCTION(BlueprintCallable, Category = "Chakra|Management")
	void AddSpiritualChakra(float Amount);

	UFUNCTION(BlueprintCallable, Category = "Chakra|Management")
	void AddNaturalEnergy(float Amount);

	// Consumo de chakra para Jutsus
	UFUNCTION(BlueprintCallable, Category = "Chakra|Management")
	bool ConsumeChakraForJutsu(float SpiritualCost, float PhysicalCost = 0.0f);

	// Regeneración pasiva
	UFUNCTION(BlueprintCallable, Category = "Chakra|Management")
	void RegenerateChakra(float DeltaTime);

	// ===================================================================
	// SISTEMA DE MODO SABIO
	// ===================================================================

	// Iniciar recolección de Energía Natural (requiere estar inmóvil)
	UFUNCTION(BlueprintCallable, Category = "Chakra|SageMode")
	void StartGatheringNaturalEnergy();

	// Detener recolección y evaluar estado
	UFUNCTION(BlueprintCallable, Category = "Chakra|SageMode")
	void StopGatheringAndEvaluate();

	// Activar Modo Sabio (si hay equilibrio perfecto)
	UFUNCTION(BlueprintCallable, Category = "Chakra|SageMode")
	bool ActivateSageMode();

	// Desactivar Modo Sabio
	UFUNCTION(BlueprintCallable, Category = "Chakra|SageMode")
	void DeactivateSageMode();

	// Verificar si está en estado perfecto de Modo Sabio
	UFUNCTION(BlueprintPure, Category = "Chakra|SageMode")
	bool IsPerfectSageMode() const;

	// Obtener el balance actual (0-100%, 100 = perfecto equilibrio)
	UFUNCTION(BlueprintPure, Category = "Chakra|SageMode")
	float GetSageBalancePercentage() const;

	// ===================================================================
	// SISTEMA DE CONTROL DE CHAKRA
	// ===================================================================

	// Aumentar control mediante entrenamiento
	UFUNCTION(BlueprintCallable, Category = "Chakra|Control")
	void IncreaseChakraControl(float Amount);

	// Obtener nivel de control actual
	UFUNCTION(BlueprintPure, Category = "Chakra|Control")
	float GetChakraControlPercentage() const;

	// Calcular probabilidad de éxito de un Jutsu basado en control
	UFUNCTION(BlueprintPure, Category = "Chakra|Control")
	float GetJutsuSuccessProbability(const FJutsuData& Jutsu) const;

	// ===================================================================
	// SISTEMA DE SELLOS MANUALES
	// ===================================================================

	// Cola actual de sellos manuales being performed
	UPROPERTY(BlueprintReadWrite, Category = "Chakra|HandSeals")
	TArray<EHandSeal> CurrentSealSequence;

	// Añadir un sello a la secuencia actual
	UFUNCTION(BlueprintCallable, Category = "Chakra|HandSeals")
	void PerformHandSeal(EHandSeal Seal);

	// Ejecutar Jutsu si la secuencia coincide
	UFUNCTION(BlueprintCallable, Category = "Chakra|HandSeals")
	bool ExecuteJutsuIfSequenceMatches(const FJutsuData& Jutsu);

	// Limpiar secuencia actual (cancelar Jutsu)
	UFUNCTION(BlueprintCallable, Category = "Chakra|HandSeals")
	void ClearSealSequence();

	// ===================================================================
	// UTILIDADES
	// ===================================================================

	// Verificar si tiene la naturaleza requerida
	UFUNCTION(BlueprintPure, Category = "Chakra|Utilities")
	bool HasNature(EChakraNature Nature) const;

	// Obtener daño recibido por retroceso de chakra (failed jutsu)
	UFUNCTION(BlueprintPure, Category = "Chakra|Utilities")
	float CalculateChakraBacklashDamage(const FJutsuData& Jutsu) const;

private:
	// Timer para recolección de energía natural
	FTimerHandle SageGatheringTimerHandle;

	// Tiempo mínimo necesario para recolectar energía natural (segundos)
	UPROPERTY(EditAnywhere, Category = "Chakra|SageMode")
	float MinGatheringTime;

	// Tasa de recolección de energía natural por segundo
	UPROPERTY(EditAnywhere, Category = "Chakra|SageMode")
	float NaturalEnergyGatherRate;

	// ¿Está actualmente recolectando?
	bool bIsGathering;

	// Tiempo acumulativo de recolección
	float AccumulatedGatherTime;

	// Función interna para actualizar estado del Modo Sabio
	void UpdateSageModeState();

	// Función interna para verificar petrificación
	void CheckPetrification();
};
