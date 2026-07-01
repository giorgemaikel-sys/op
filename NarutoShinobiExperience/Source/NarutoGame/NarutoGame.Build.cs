using UnrealBuildTool;

public class NarutoGame : ModuleRules
{
    public NarutoGame(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.PrefixOrShared;
        
        PublicDependencyModuleNames.AddRange(new string[] 
        { 
            "Core", 
            "CoreUObject", 
            "Engine", 
            "InputCore",
            "GameplayTags"
        });

        PrivateDependencyModuleNames.AddRange(new string[] 
        { 
            "Slate", 
            "SlateCore" 
        });
    }
}
