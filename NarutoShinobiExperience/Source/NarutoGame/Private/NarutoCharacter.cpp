// NarutoCharacter.cpp
#include "NarutoCharacter.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Components/CapsuleComponent.h"
#include "Math/UnrealMathUtility.h"

ANarutoCharacter::ANarutoCharacter()
{
	PrimaryActorTick.bCanEverTick = true;

	// Crear el componente de Chakra
	ChakraSystem = CreateDefaultSubobject<UChakraSystemComponent>(TEXT("ChakraSystem"));
	ChakraSystem->SetupAttachment(RootComponent);

	// Configuración de Dash
	bIsDashing = false;
	DashDuration = 0.3f;
	DashDistance = 800.0f;
	DashIframes = 0.25f;

	// Configuración de Parry
	bCanParry = true;
	bIsAttemptingParry = false;
	PerfectParryWindow = 0.1f; // 100ms para parry perfecto
	NormalParryWindow = 0.3f;  // 300ms para parry normal

	// Configuración de HP
	CurrentHP = 1000.0f;
	MaxHP = 1000.0f;

	// Ocho Puertas
	EightGatesOpened = 0;

	// Sharingan
	bSharinganActive = false;
	SharinganLevel = 0;
}

void ANarutoCharacter::BeginPlay()
{
	Super::BeginPlay();

	// Configurar eventos del sistema de chakra
	if (ChakraSystem)
	{
		ChakraSystem->OnPetrified.AddDynamic(this, [](AActor* Owner) {
			// Game Over logic aquí
			if (Owner)
			{
				// Destruir o deshabilitar al personaje
				Owner->SetActorHiddenInGame(true);
				Owner->SetActorEnableCollision(false);
			}
		});
	}
}

void ANarutoCharacter::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	// Aplicar efectos del Modo Sabio si está activo
	if (IsInSageMode())
	{
		ApplySageModeEffects();
	}

	// Aplicar drain de HP por las Ocho Puertas
	if (EightGatesOpened > 0)
	{
		float HPDrain = GetHPDrainPerSecond() * DeltaTime;
		TakeDamage(HPDrain);
	}
}

void ANarutoCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	Super::SetupPlayerInputComponent(PlayerInputComponent);

	// Bindings de movimiento básico
	PlayerInputComponent->BindAction("Jump", IE_Pressed, this, &ANarutoCharacter::InputJump);
	
	// Bindings de combate
	PlayerInputComponent->BindAction("Dash", IE_Pressed, this, &ANarutoCharacter::InputDash);
	PlayerInputComponent->BindAction("Parry", IE_Pressed, this, &ANarutoCharacter::InputParry);
	PlayerInputComponent->BindAction("Attack", IE_Pressed, this, &ANarutoCharacter::InputAttack);
	PlayerInputComponent->BindAction("Jutsu", IE_Pressed, this, &ANarutoCharacter::InputJutsu);
}

// ===================================================================
// ACCIONES DE MOVIMIENTO Y COMBATE
// ===================================================================

void ANarutoCharacter::PerformDash(const FVector& Direction)
{
	if (bIsDashing || IsDead())
	{
		return;
	}

	// Verificar si hay suficiente chakra físico para el dash
	if (ChakraSystem && !ChakraSystem->ConsumeChakraForJutsu(10.0f, 5.0f))
	{
		// No hay suficiente chakra
		OnDashCompleted.Broadcast(false);
		return;
	}

	bIsDashing = true;

	// Calcular dirección normalizada
	FVector DashDirection = Direction.GetSafeNormal();

	// Aplicar impulso inicial
	GetCharacterMovement()->Launch(FVector(DashDirection.X, DashDirection.Y, 0.2f) * DashDistance);

	// Habilitar invulnerabilidad temporal (lógica de juego, no implementada aquí completamente)
	// En producción, se usaría un sistema de colisiones por canales

	// Programar finalización del dash
	GetWorldTimerManager().SetTimer(DashTimerHandle, this, &ANarutoCharacter::CompleteDash, DashDuration, false);

	// Efectos visuales y de sonido irían aquí (Particle Systems, Audio Components)
}

void ANarutoCharacter::AttemptParry()
{
	if (!bCanParry || bIsAttemptingParry || IsDead())
	{
		return;
	}

	bIsAttemptingParry = true;

	// Iniciar ventana de tiempo para el parry
	GetWorldTimerManager().SetTimer(ParryTimerHandle, this, &ANarutoCharacter::CheckParrySuccess, NormalParryWindow, false);

	// Animación de postura de parry iría aquí
}

bool ANarutoCharacter::UseKawarimi(AActor* TargetLocation)
{
	if (IsDead() || !TargetLocation)
	{
		return false;
	}

	// Verificar chakra necesario (costo alto para esta técnica)
	if (ChakraSystem && !ChakraSystem->ConsumeChakraForJutsu(50.0f, 20.0f))
	{
		return false;
	}

	// Guardar posición actual para el tronco de sustitución
	FVector OriginalLocation = GetActorLocation();

	// Teletransportar al personaje a la nueva ubicación
	SetActorLocation(TargetLocation->GetActorLocation());

	// Spawnear un tronco o clon en la posición original (lógica simplificada)
	// En producción: spawnear un actor de tipo "SubstitutionLog" con efectos

	// Disparar evento
	OnKawarimiUsed.Broadcast(TargetLocation);

	return true;
}

bool ANarutoCharacter::IsInSageMode() const
{
	return ChakraSystem && ChakraSystem->IsPerfectSageMode();
}

// ===================================================================
// SISTEMA DE OCHO PUERTAS INTERNAS
// ===================================================================

bool ANarutoCharacter::OpenNextGate()
{
	if (EightGatesOpened >= 8)
	{
		// Todas las puertas ya están abiertas
		return false;
	}

	// Verificar si hay suficiente HP para abrir la siguiente puerta
	// Cada puerta requiere un % mínimo de HP
	float MinHPRequired = MaxHP * (1.0f - (EightGatesOpened * 0.1f));
	if (CurrentHP < MinHPRequired)
	{
		return false; // No hay suficiente HP
	}

	EightGatesOpened++;

	// Efectos visuales: aura de color cambia según la puerta
	// 1ª Puerta: Verde, 2ª: Amarillo, etc.

	return true;
}

void ANarutoCharacter::CloseAllGates()
{
	EightGatesOpened = 0;
	// El HP drain se detiene automáticamente en Tick
}

float ANarutoCharacter::GetDamageMultiplierFromGates() const
{
	// Multiplicador exponencial por cada puerta
	// Puerta 1: x2, Puerta 2: x4, Puerta 3: x8, ..., Puerta 8: x256
	if (EightGatesOpened == 0) return 1.0f;

	return FMath::Pow(2.0f, EightGatesOpened);
}

float ANarutoCharacter::GetHPDrainPerSecond() const
{
	if (EightGatesOpened == 0) return 0.0f;

	// Drain aumenta exponencialmente con cada puerta
	// Puerta 1: 5 HP/s, Puerta 2: 15 HP/s, Puerta 3: 40 HP/s, etc.
	return FMath::Pow(3.0f, EightGatesOpened) * 1.5f;
}

// ===================================================================
// GESTIÓN DE ESTADOS Y SALUD
// ===================================================================

void ANarutoCharacter::TakeDamage(float Amount, UDamageType* DamageType)
{
	if (IsDead()) return;

	// Modificadores de daño basados en estados
	float DamageMultiplier = 1.0f;

	// Sharingan permite reducir daño mediante predicción
	if (bSharinganActive && SharinganLevel > 0)
	{
		DamageMultiplier -= (SharinganLevel * 0.1f); // 10-30% menos daño
	}

	// Modo Sabio reduce daño
	if (IsInSageMode())
	{
		DamageMultiplier *= 0.7f; // 30% menos daño
	}

	// Aplicar daño final
	float FinalDamage = Amount * DamageMultiplier;
	CurrentHP = FMath::Clamp(CurrentHP - FinalDamage, 0.0f, MaxHP);

	if (IsDead())
	{
		// Lógica de muerte
		// En producción: reproducir animación de muerte, notificar al GameMode, etc.
	}
}

void ANarutoCharacter::Heal(float Amount)
{
	if (IsDead()) return;

	// El Modo Sabio aumenta la curación
	float HealMultiplier = IsInSageMode() ? 1.5f : 1.0f;
	
	CurrentHP = FMath::Clamp(CurrentHP + (Amount * HealMultiplier), 0.0f, MaxHP);
}

bool ANarutoCharacter::IsDead() const
{
	return CurrentHP <= 0.0f;
}

// ===================================================================
// SISTEMA DE SHARINGAN
// ===================================================================

void ANarutoCharacter::ActivateSharingan()
{
	if (SharinganLevel == 0)
	{
		// No tiene Sharingan
		return;
	}

	bSharinganActive = true;

	// Efectos visuales: cambiar material de ojos, partículas rojas
	// Activar cámara especial con ralentización en esquivas (Bullet Time)
}

void ANarutoCharacter::DeactivateSharingan()
{
	bSharinganActive = false;
}

bool ANarutoCharacter::IsSharinganActive() const
{
	return bSharinganActive && SharinganLevel > 0;
}

// ===================================================================
// INPUT BINDINGS
// ===================================================================

void ANarutoCharacter::InputDash()
{
	if (!bIsDashing)
	{
		// Obtener dirección del input o hacia donde mira la cámara
		FVector InputDirection = GetActorForwardVector();
		
		// En producción, obtener dirección del stick analógico
		PerformDash(InputDirection);
	}
}

void ANarutoCharacter::InputParry()
{
	AttemptParry();
}

void ANarutoCharacter::InputJump()
{
	if (!bIsDashing)
	{
		Jump();
	}
}

void ANarutoCharacter::InputAttack()
{
	// Sistema de combos de Taijutsu
	// En producción: manejar inputs secuenciales para combos, verificar si está en rango, etc.
	
	// Si está en Modo Sabio, los ataques tienen hitbox extendida
	if (IsInSageMode())
	{
		// Aumentar rango de ataque cuerpo a cuerpo
	}
}

void ANarutoCharacter::InputJutsu()
{
	// Abrir rueda de Jutsus o ejecutar último usado
	// En producción: sistema de selección de Jutsus con sellos manuales
}

// ===================================================================
// FUNCIONES INTERNAS
// ===================================================================

void ANarutoCharacter::CompleteDash()
{
	bIsDashing = false;
	OnDashCompleted.Broadcast(true);
}

void ANarutoCharacter::CheckParrySuccess()
{
	bIsAttemptingParry = false;

	// En producción, aquí se verificaría si un ataque enemigo ocurrió durante la ventana
	// Por ahora, simulamos un parry exitoso para el ejemplo
	
	bool bSuccessful = true; // Esto vendría de la detección de colisión con ataque enemigo
	float TimingQuality = PerfectParryWindow / NormalParryWindow; // Calidad del timing

	OnParryAttempt.Broadcast(bSuccessful, TimingQuality);

	if (bSuccessful)
	{
		// Contraataque automático o ventaja de frames
		// En producción: aplicar stun al enemigo, permitir combo garantizado, etc.
	}
}

void ANarutoCharacter::ApplySageModeEffects()
{
	if (!ChakraSystem || !IsInSageMode()) return;

	// Bonus de Modo Sabio:
	// 1. Detección sensorial (ver enemigos a través de paredes) - lógica en PlayerController
	// 2. Regeneración aumentada (ya manejado en ChakraSystem)
	// 3. Hitboxes extendidas en Taijutsu (manejado en InputAttack)
	// 4. Rasenshuriken lanzable (lógica en sistema de Jutsus)

	// Ejemplo: aumentar velocidad de movimiento ligeramente
	GetCharacterMovement()->MaxWalkSpeed *= 1.2f;
}
