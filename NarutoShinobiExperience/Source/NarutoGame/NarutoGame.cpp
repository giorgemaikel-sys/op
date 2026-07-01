#include "NarutoGame.h"

#define LOCTEXT_NAMESPACE "FNarutoGameModule"

void FNarutoGameModule::StartupModule()
{
    UE_LOG(LogTemp, Log, TEXT("NarutoGame module loaded - Shinobi System Ready!"));
}

void FNarutoGameModule::ShutdownModule()
{
    UE_LOG(LogTemp, Log, TEXT("NarutoGame module unloaded"));
}

#undef LOCTEXT_NAMESPACE
    
IMPLEMENT_MODULE(FNarutoGameModule, NarutoGame)
