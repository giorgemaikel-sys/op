// NarutoCombatTypes.h
#pragma once

#include "CoreMinimal.h"
#include "UObject/Object.h"
#include "NarutoCombatTypes.generated.h"

// Tipos de Naturaleza de Chakra
UENUM(BlueprintType)
enum class EChakraNature : uint8
{
	None		UMETA(DisplayName = "None"),
	Fire		UMETA(DisplayName = "Fire (Katon)"),
	Wind		UMETA(DisplayName = "Wind (Fuuton)"),
	Lightning	UMETA(DisplayName = "Lightning (Raiton)"),
	Earth		UMETA(DisplayName = "Earth (Doton)"),
	Water		UMETA(DisplayName = "Water (Suiton)"),
	Yin			UMETA(DisplayName = "Yin Release"),
	Yang		UMETA(DisplayName = "Yang Release"),
	Ice			UMETA(DisplayName = "Ice (Kekkei Genkai)"),
	Wood		UMETA(DisplayName = "Wood (Kekkei Genkai)"),
	Lava		UMETA(DisplayName = "Lava (Kekkei Genkai)")
};

// Tipos de Sellos Manuales (Mapeo de Inputs)
UENUM(BlueprintType)
enum class EHandSeal : uint8
{
	Rat		UMETA(DisplayName = "Rat"),
	Ox		UMETA(DisplayName = "Ox"),
	Tiger	UMETA(DisplayName = "Tiger"),
	Hare	UMETA(DisplayName = "Hare"),
	Dragon	UMETA(DisplayName = "Dragon"),
	Snake	UMETA(DisplayName = "Snake"),
	Bird	UMETA(DisplayName = "Bird"),
	Horse	UMETA(DisplayName = "Horse"),
	Monkey	UMETA(DisplayName = "Monkey"),
	Boar	UMETA(DisplayName = "Boar"),
	Dog		UMETA(DisplayName = "Dog"),
	None	UMETA(DisplayName = "None")
};

// Rangos de Jutsu (Impacto en costo y daño base)
UENUM(BlueprintType)
enum class EJutsuRank : uint8
{
	E_Rank	UMETA(DisplayName = "E - Académico"),
	D_Rank	UMETA(DisplayName = "D - Genin"),
	C_Rank	UMETA(DisplayName = "C - Chunin"),
	B_Rank	UMETA(DisplayName = "B - Jonin"),
	A_Rank	UMETA(DisplayName = "A - Alto Nivel"),
	S_Rank	UMETA(DisplayName = "S - Legendario/Kage")
};

// Estado del Modo Sabio
UENUM(BlueprintType)
enum class ESageModeState : uint8
{
	Inactive		UMETA(DisplayName = "Inactive"),
	Gathering		UMETA(DisplayName = "Gathering Natural Energy"),
	Active			UMETA(DisplayName = "Active (Perfect Balance)"),
	Unstable_Low	UMETA(DisplayName = "Unstable (Low Natural Energy)"),
	Unstable_High	UMETA(DisplayName = "Unstable (High Natural Energy - Risk)"),
	Petrified		UMETA(DisplayName = "Petrified (Game Over State)")
};

// Estructura para los 3 tipos de energía
USTRUCT(BlueprintType)
struct FChakraLevels
{
	GENERATED_BODY()

	// Chakra Físico (Stamina/HP related)
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chakra")
	float Physical = 100.0f;

	// Chakra Espiritual (Maná para Jutsus)
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chakra")
	float Spiritual = 100.0f;

	// Energía Natural (Solo para Modo Sabio)
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chakra")
	float Natural = 0.0f;

	// Máximos
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chakra")
	float MaxPhysical = 100.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chakra")
	float MaxSpiritual = 100.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chakra")
	float MaxNatural = 100.0f;

	// Control de Chakra (0-100%, oculto pero accesible)
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chakra")
	float ControlPercentage = 50.0f;

	FORCEINLINE float GetTotalChakra() const { return Physical + Spiritual; }
	
	FORCEINLINE float GetSageBalance() const 
	{
		if (Physical <= 0 || Spiritual <= 0) return 0.0f;
		float Total = Physical + Spiritual + Natural;
		if (Total <= 0) return 0.0f;
		// Retorna qué tan cerca está del equilibrio perfecto (33.3% cada uno)
		float TargetPerThird = Total / 3.0f;
		float DiffPhysical = FMath::Abs(Physical - TargetPerThird);
		float DiffSpiritual = FMath::Abs(Spiritual - TargetPerThird);
		float DiffNatural = FMath::Abs(Natural - TargetPerThird);
		float AvgDiff = (DiffPhysical + DiffSpiritual + DiffNatural) / 3.0f;
		return FMath::Clamp(100.0f - (AvgDiff / TargetPerThird * 100.0f), 0.0f, 100.0f);
	}
};

// Estructura de Datos para un Jutsu
USTRUCT(BlueprintType)
struct FJutsuData
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Jutsu")
	FName JutsuName = NAME_None;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Jutsu")
	EChakraNature PrimaryNature = EChakraNature::None;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Jutsu")
	EJutsuRank Rank = EJutsuRank::E_Rank;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Jutsu")
	TArray<EHandSeal> SealSequence;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Jutsu")
	float BaseDamage = 10.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Jutsu")
	float ChakraCost = 20.0f;

	// Si es true, ignora parcialmente la debilidad elemental (ej. Amaterasu)
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Jutsu")
	bool bIsSpecialChakra = false; 

	// Para Susanoo: etapas (1-5)
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Jutsu")
	int32 SusanooStage = 0;
};

// Funciones utilitarias de combate
UCLASS()
class NARUTO_GAME_API UNarutoCombatLibrary : public UBlueprintFunctionLibrary
{
	GENERATED_BODY()

public:
	// Calcula el multiplicador elemental basado en atacante vs defensor
	UFUNCTION(BlueprintCallable, Category = "Combat|Elements")
	static float CalculateElementalMultiplier(EChakraNature AttackerNature, EChakraNature DefenderNature, bool bIsSpecialChakra);

	// Calcula el daño final considerando Modo Sabio, Control y Elemento
	UFUNCTION(BlueprintCallable, Category = "Combat|Damage")
	static float CalculateFinalDamage(const FJutsuData& Jutsu, float AttackerControl, bool bIsSageMode, float DefenderResistance);
};
