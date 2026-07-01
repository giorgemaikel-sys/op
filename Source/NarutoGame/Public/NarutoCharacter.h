// NarutoCharacter.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "NarutoCombatTypes.h"
#include "ChakraSystemComponent.h"
#include "NarutoCharacter.generated.h"

// Delegados para eventos de combate
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDashCompleted, bool, bSuccessful);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnParryAttempt, bool, bSuccessful, float, TimingWindow);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnKawarimiUsed, AActor*, NewLocation);

UCLASS(config=Game)
class NARUTO_GAME_API ANarutoCharacter : public ACharacter
{
	GENERATED_BODY()

public:
	ANarutoCharacter();

protected:
	virtual void BeginPlay() override;

public:
	virtual void Tick(float DeltaTime) override;
	virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

	// ===================================================================
	// COMPONENTES
	// ===================================================================

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
	UChakraSystemComponent* ChakraSystem;

	// ===================================================================
	// PROPIEDADES DE COMBATE
	// ===================================================================

	// ¿Está actualmente en estado de dash (invulnerable)?
	UPROPERTY(BlueprintReadOnly, Category = "Combat|State")
	bool bIsDashing;

	// Duración del dash en segundos
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat|Dash")
	float DashDuration;

	// Distancia del dash
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat|Dash")
	float DashDistance;

	// Tiempo de invulnerabilidad durante el dash
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat|Dash")
	float DashIframes;

	// ¿Puede hacer parry?
	UPROPERTY(BlueprintReadOnly, Category = "Combat|State")
	bool bCanParry;

	// Ventana de tiempo para parry perfecto (Just Frame)
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat|Parry")
	float PerfectParryWindow;

	// Ventana de tiempo para parry normal
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat|Parry")
	float NormalParryWindow;

	// ¿Está intentando un parry?
	UPROPERTY(BlueprintReadOnly, Category = "Combat|State")
	bool bIsAttemptingParry;

	// Contador de Puertas Internas abiertas (0-8)
	UPROPERTY(BlueprintReadWrite, Category = "Combat|EightGates")
	int32 EightGatesOpened;

	// HP actual (separado del chakra físico para claridad)
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat|Health")
	float CurrentHP;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat|Health")
	float MaxHP;

	// ===================================================================
	// EVENTOS
	// ===================================================================

	UPROPERTY(BlueprintAssignable, Category = "Combat|Events")
	FOnDashCompleted OnDashCompleted;

	UPROPERTY(BlueprintAssignable, Category = "Combat|Events")
	FOnParryAttempt OnParryAttempt;

	UPROPERTY(BlueprintAssignable, Category = "Combat|Events")
	FOnKawarimiUsed OnKawarimiUsed;

	// ===================================================================
	// ACCIONES DE MOVIMIENTO
	// ===================================================================

	// Ejecutar Dash con i-frames
	UFUNCTION(BlueprintCallable, Category = "Combat|Movement")
	void PerformDash(const FVector& Direction);

	// Intentar Parry (bloqueo perfecto)
	UFUNCTION(BlueprintCallable, Category = "Combat|Defense")
	void AttemptParry();

	// Usar Kawarimi no Jutsu (sustitución con tronco)
	UFUNCTION(BlueprintCallable, Category = "Combat|Defense")
	bool UseKawarimi(AActor* TargetLocation);

	// Verificar si está en Modo Sabio y aplicar bonuses
	UFUNCTION(BlueprintPure, Category = "Combat|SageMode")
	bool IsInSageMode() const;

	// ===================================================================
	// SISTEMA DE OCHO PUERTAS INTERNAS
	// ===================================================================

	// Abrir la siguiente puerta (con riesgo de daño permanente)
	UFUNCTION(BlueprintCallable, Category = "Combat|EightGates")
	bool OpenNextGate();

	// Cerrar todas las puertas
	UFUNCTION(BlueprintCallable, Category = "Combat|EightGates")
	void CloseAllGates();

	// Obtener multiplicador de daño actual basado en puertas abiertas
	UFUNCTION(BlueprintPure, Category = "Combat|EightGates")
	float GetDamageMultiplierFromGates() const;

	// Obtener HP drain por segundo basado en puertas abiertas
	UFUNCTION(BlueprintPure, Category = "Combat|EightGates")
	float GetHPDrainPerSecond() const;

	// ===================================================================
	// GESTIÓN DE ESTADOS
	// ===================================================================

	// Aplicar daño al personaje
	UFUNCTION(BlueprintCallable, Category = "Combat|Health")
	void TakeDamage(float Amount, UDamageType* DamageType = nullptr);

	// Curar al personaje
	UFUNCTION(BlueprintCallable, Category = "Combat|Health")
	void Heal(float Amount);

	// Verificar si está muerto
	UFUNCTION(BlueprintPure, Category = "Combat|Health")
	bool IsDead() const;

	// Activar Sharingan (si el personaje lo tiene)
	UFUNCTION(BlueprintCallable, Category = "Combat|Dojutsu")
	void ActivateSharingan();

	// Desactivar Sharingan
	UFUNCTION(BlueprintCallable, Category = "Combat|Dojutsu")
	void DeactivateSharingan();

	// ¿Tiene Sharingan activo?
	UFUNCTION(BlueprintPure, Category = "Combat|Dojutsu")
	bool IsSharinganActive() const;

	// ===================================================================
	// INPUT BINDINGS (Para Blueprint o C++)
	// ===================================================================

	// Input para Dash
	UFUNCTION()
	void InputDash();

	// Input para Parry
	UFUNCTION()
	void InputParry();

	// Input para Salto
	UFUNCTION()
	void InputJump();

	// Input para atacar (Taijutsu)
	UFUNCTION()
	void InputAttack();

	// Input para Jutsu (abre menú o ejecuta último usado)
	UFUNCTION()
	void InputJutsu();

private:
	// Timer handle para el dash
	FTimerHandle DashTimerHandle;

	// Timer handle para la ventana de parry
	FTimerHandle ParryTimerHandle;

	// ¿Compartingán activo?
	bool bSharinganActive;

	// Nivel de Sharingan (1-3 tomoes, o Mangekyou)
	int32 SharinganLevel;

	// Función interna para actualizar estado de dash
	void CompleteDash();

	// Función interna para verificar éxito de parry
	void CheckParrySuccess();

	// Función interna para aplicar efectos del Modo Sabio
	void ApplySageModeEffects();
};
