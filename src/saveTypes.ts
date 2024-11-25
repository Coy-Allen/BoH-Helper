/* eslint-disable @typescript-eslint/naming-convention */

type DictionaryStringInt =
	{"$type": "System.Collections.Generic.Dictionary`2[[System.String, mscorlib],[System.Int32, mscorlib]], mscorlib"} &
	Record<string, number>;
interface DictionaryStringString {
	"$type": "System.Collections.Generic.Dictionary`2[[System.String, mscorlib],[System.String, mscorlib]], mscorlib";
	[key: string]: string;
}
type AspectsDictionary =
	{"$type": "SecretHistories.Core.AspectsDictionary, SecretHistories.Main"} &
	Record<string, number>;

export interface PersistedGameState {
	"$type": "PersistedGameState";
	CharacterCreationCommands: CharacterCreationCommand[];
	RootPopulationCommand: RootPopulationCommand;
	PopulateXamanekCommand: PopulateXamanekCommand;
	NotificationCommands: []; // TODO: save file does not have an example
	Version: VersionNumber;
	IsFresh: boolean;
}
interface VersionNumber {
	"$type": "SecretHistories.Entities.VersionNumber, SecretHistories.Main";
	Version: string;
}
interface EnviroFxCommand {
	"$type": "SecretHistories.Commands.EnviroFxCommand, SecretHistories.Main";
	Concern: string;
	Effect: string;
	Parameter: string;
	GetFullFx: string;
}
interface PopulateXamanekCommand {
	"$type": "PopulateXamanekCommand";
	CurrentItineraries:
		{"$type": "System.Collections.Generic.Dictionary`2[[System.String, mscorlib],[SecretHistories.Assets.Scripts.Application.Tokens.TravelItineraries.TokenItinerary, SecretHistories.Main]], mscorlib"} &
		Record<string, TokenItinerary>;
	CurrentEnviroFxCommands:
		{"$type": "System.Collections.Generic.Dictionary`2[[System.String, mscorlib],[SecretHistories.Commands.EnviroFxCommand, SecretHistories.Main]], mscorlib"} &
		Record<string, EnviroFxCommand>;
	CurrentSphereBlocks: []; // TODO: save file does not have an example
}
interface CharacterCreationCommand {
	"$type": "CharacterCreationCommand";
	Name: string;
	Profession: string;
	ActiveLegacyId: string;
	EndingTriggeredId: null; // TODO: save file does not have an example
	DateTimeCreated: string;
	InProgressHistoryRecords: DictionaryStringString;
	PreviousCharacterHistoryRecords: DictionaryStringString;
	UniqueElementsManifested: string[];
	AmbittableRecipesUnlocked: string[];
	CreatedInVersion: VersionNumber;
	CurrentFocus: Focus;
	CurrentHouses: []; // TODO: save file does not have an example
}
interface Focus {
	"$type": "SecretHistories.Entities.Focus, SecretHistories.Main";
	X: number;
	Y: number;
	Z: number;
}
interface RootPopulationCommand {
	"$type": "RootPopulationCommand";
	Mutations: DictionaryStringInt;
	Spheres: SphereCreationCommand[];
	DealersTable: PopulateDominionCommand;
	TokensAtArbitraryPaths: []; // TODO: save file does not have an example
}
interface PopulateDominionCommand {
	"$type": "PopulateDominionCommand";
	Identifier: "0";
	Spheres: SphereCreationCommand[];
}
interface SphereCreationCommand {
	"$type": "SphereCreationCommand";
	OwnerSphereIdentifier: null; // TODO: save file does not have an example
	GoverningSphereSpec: SphereSpec;
	Tokens: TokenCreationCommand[];
	Shrouded: boolean;
	PersistentSphereData: null|UIHandSphereData;
	Illuminations: DictionaryStringString;
}
interface SphereSpec {
	"$type": "SecretHistories.Entities.SphereSpec, SecretHistories.Main";
	Label: string;
	ActionId: string;
	Description: string;
	AvailableFromHouse: string;
	Essential: AspectsDictionary;
	Required: AspectsDictionary;
	Forbidden: AspectsDictionary;
	IfAspectsPresent: DictionaryStringString;
	Greedy: boolean;
	Angels: []; // TODO: save file does not have an example
	FromPath: FucinePath;
	EnRouteSpherePath: FucinePath;
	WindowsSpherePath: FucinePath;
	SphereType: string;
	AllowAnyToken: boolean;
	Id: string;
	Lever: string;
}
// TODO: stub. save file does not have an example
type TokenItinerary = Record<string, unknown>;
interface TokenCreationCommand {
	"$type": "TokenCreationCommand";
	Location: TokenLocation;
	HomeLocation: null|TokenLocation;
	Payload: ElementStackCreationCommand|SituationCreationCommand|PopulateNxCommand|PopulateTerrainFeatureCommand;
	PlacementAlreadyChronicled: boolean;
	Defunct: boolean;
	CurrentState: DroppedInSphereState|TravelledToSphere;
}
interface FucinePath {
	"$type": "SecretHistories.Fucine.FucinePath, SecretHistories.Main";
	Filter: null; // TODO: save file does not have an example
	Path: string;
}
interface Vector3 {
	"$type": "UnityEngine.Vector3, UnityEngine.CoreModule";
	x: number;
	y: number;
	z: number;
	normalized?: Vector3;
	magnitude: number;
	sqrMagnitude: number;
}
interface TokenLocation {
	"$type": "SecretHistories.UI.TokenLocation, SecretHistories.Main";
	LocalPosition: Vector3;
	AtSpherePath: FucinePath;
}
interface TravelledToSphere {
	"$type": "SecretHistories.States.TokenStates.TravelledToSphere, SecretHistories.Main";
	// TODO: stub. save file does not have an example
}
interface DroppedInSphereState {
	"$type": "SecretHistories.States.TokenStates.DroppedInSphereState, SecretHistories.Main";
	// TODO: stub. save file does not have an example
}
interface UIHandSphereData {
	"$type": "SecretHistories.Spheres.UIHandSphereData, SecretHistories.Main";
	DefaultPosition: number;
	CurrentPosition: number;
}
interface ElementStackCreationCommand extends payloadTemplate {
	"$type": "ElementStackCreationCommand";
	EntityId: string;
	Illuminations: DictionaryStringString;
	Defunct: boolean;
	IsShrouded: boolean;
	LifetimeRemaining: number;
}
interface SituationCreationCommand extends payloadTemplate {
	"$type": "SituationCreationCommand";
	LastSituationCreated: null; // TODO: save file does not have an example
	VerbId: string;
	OutputPath: null; // TODO: save file does not have an example
	CurrentRecipeId: string;
	FallbackRecipeId: string;
	StateIdentifier: number;
	TimeRemaining: number;
	IsOpen: boolean;
	HasGhostNote: boolean;
	CommandQueue: unknown[]; // TODO: save file does not have an example
}
interface PopulateNxCommand extends payloadTemplate {
	"$type": "PopulateNxCommand";
	OutcomeMessage: string;
	IsShrouded: boolean;
	IsSealed: boolean;
	IsOpen: boolean;
	LockedInRecipe: NullRecipe;
	LastRunRecipe: NullRecipe;
}
interface PopulateTerrainFeatureCommand extends payloadTemplate {
	"$type": "PopulateTerrainFeatureCommand";
	EdensEnacted: string[];
	IsSealed: boolean;
	IsShrouded: boolean;
	HasPreviouslyUnshrouded: boolean;
}
interface payloadTemplate {
	"$type": string;
	Id: string;
	Dominions: PopulateDominionCommand[];
	Quantity: number;
	Mutations: DictionaryStringInt;
}
interface NullRecipe {
	"$type": "SecretHistories.Entities.NullRecipe, SecretHistories.Main";
	Priority: number;
	ActionId: string;
	Blocks: boolean;
	Reqs: DictionaryStringString;
	ExtantReqs: DictionaryStringString;
	Greq: DictionaryStringString;
	Ngreq: DictionaryStringString;
	FXReqs: DictionaryStringString;
	Seeking: DictionaryStringString;
	Effects: DictionaryStringString;
	XPans: DictionaryStringInt;
	FX: DictionaryStringString;
	Aspects: AspectsDictionary;
	Mutations: DictionaryStringInt;
	Purge: DictionaryStringInt;
	HaltVerb: DictionaryStringInt;
	DeleteVerb: DictionaryStringInt;
	Achievements: unknown[]; // TODO: save file does not have an example
	SignalImportantLoop: boolean;
	AudioOneShot: null; // TODO: save file does not have an example
	SignalEndingFlavour: number;
	Craftable: boolean;
	Notable: boolean;
	HintOnly: boolean;
	Ambittable: boolean;
	Warmup: number;
	Inherits: string;
	Preface: string;
	StartLabel: string;
	Label: string;
	StartDescription: string;
	Desc: string;
	Comments: string;
	DeckEffects: DictionaryStringString;
	Alt: unknown[]; // TODO: save file does not have an example
	Lalt: unknown[]; // TODO: save file does not have an example
	Inductions: unknown[]; // TODO: save file does not have an example
	Linked: unknown[]; // TODO: save file does not have an example
	Ending: string;
	Icon: string;
	BurnImage: null; // TODO: save file does not have an example
	Run: string;
	PreSlots: unknown[]; // TODO: save file does not have an example
	Slots: unknown[]; // TODO: save file does not have an example
	InternalDeck: DeckSpec;
	Id: string;
	Lever: string;
}
interface DeckSpec {
	"$type": "SecretHistories.Entities.DeckSpec, SecretHistories.Main";
	DefaultCard: string;
	ResetOnExhaustion: boolean;
	Label: string;
	Desc: string;
	Cover: string;
	Comments: string;
	IsHidden: boolean;
	Draws: number;
	Spec: []; // TODO: save file does not have an example
	DrawMessages: DictionaryStringString;
	DefaultDrawMessages: DictionaryStringString;
	Id: string;
	Lever: string;
}
