import { isDebug } from "./config.js";
// TODO: maybe put these into nested objects? like save.verbs.get()?
// FIXME: replace all console.* calls with terminal calls
class dataWrapper {
    _data;
    _keyFunc;
    constructor(keyFunc, data = []) {
        this._keyFunc = keyFunc;
        this._data = new Map();
        this.addAll(data);
        // data.map(item=>[keyFunc(item), item]);
    }
    overwrite(items) {
        this.clear();
        this.addAll(items);
    }
    clear() { this._data.clear(); }
    size() { return this._data.size; }
    get(key) { return this._data.get(key); }
    has(item) { return this.hasKey(this._keyFunc(item)); }
    hasKey(key) { return this._data.has(key); }
    hasValue(item) { return this.values().includes(item); }
    addAll(items) { items.forEach(item => this.add(item)); }
    add(item) {
        const key = this._keyFunc(item);
        const isPresent = this.hasKey(key);
        if (isDebug && isPresent) {
            console.warn("dupe found: " + key);
        }
        this._data.set(key, item);
        return isPresent;
    }
    some(filter) { return this.find(filter) !== undefined; }
    find(filter) { return this.values().find(filter); }
    findAll(filter) { return this.filter(filter); }
    filter(...filters) {
        return filters.reduce((values, filter) => values.filter(filter), this.values());
    }
    keys() { return [...this._data.keys()]; }
    values() { return [...this._data.values()]; }
}
class dataWrapperInherits extends dataWrapper {
    getInherited(key) {
        const result = [];
        let target = key;
        while (true) {
            const lookup = this.get(target);
            if (lookup === undefined) {
                break;
            }
            result.push(lookup);
            if (!lookup.inherits) {
                break;
            }
            target = lookup.inherits;
        }
        return result;
    }
    getInheritedProperty(key, property) {
        return this.getInherited(key)
            .map(obj => obj[property])
            .filter((prop) => prop !== undefined && prop !== null);
    }
}
/* DATA */
export const data = {
    elements: new dataWrapperInherits(item => item.id),
    recipes: new dataWrapperInherits(item => item.id),
    verbs: new dataWrapper(item => item.id),
    decks: new dataWrapper(item => item.id),
    aspects: new dataWrapper(item => item),
};
export const save = {
    raw: undefined,
    rooms: new dataWrapper(item => item.payload.id),
    roomsUnlockable: new dataWrapper(item => item.payload.id),
    elements: new dataWrapper(item => item.id),
    recipes: new dataWrapper(item => item),
    decks: new dataWrapper(item => item[0]),
    verbs: new dataWrapper(item => item),
};
export function loadSave(saveFile) {
    save.raw = saveFile;
    save.rooms.overwrite(getUnlockedRoomsFromSave(saveFile));
    save.roomsUnlockable.overwrite(getUnlockableRoomsFromSave(saveFile));
    save.elements.overwrite([getItemsFromSave(), getHand(saveFile)].flat());
    save.verbs.overwrite(getVerbsFromSave());
    save.decks.overwrite(getDecksFromSave(saveFile));
    save.recipes.overwrite(saveFile.charactercreationcommands.flatMap(character => character.ambittablerecipesunlocked));
}
function getHand(json) {
    // TODO: rewrite this
    const getSphere = (id) => json.rootpopulationcommand.spheres.find((sphere) => sphere.governingspherespec.id === id)?.tokens ?? [];
    const cards = [
        getSphere("hand.abilities"),
        getSphere("hand.skills"),
        getSphere("hand.memories"),
        getSphere("hand.misc"),
    ].flatMap(tokens => tokens
        .map(token => token.payload)
        .filter((payload) => payload.$type === "elementstackcreationcommand")
        .map(payload => {
        // TODO: move this to saveElementExtentionMerging
        const aspects = [payload.mutations, ...data.elements.getInheritedProperty(payload.entityid, "aspects")];
        const mergedAspects = mergeAspects(aspects);
        // remove typing
        delete mergedAspects["$type"];
        return Object.assign({}, payload, {
            aspects: mergedAspects,
            room: "hand",
        });
    }));
    return cards;
}
function getUnlockedRoomsFromSave(json) {
    // TODO: rewrite this
    // FIXME: can't keep track of parent relationships due to filtering arrays
    const library = json.rootpopulationcommand.spheres.find((sphere) => sphere.governingspherespec.id === "library");
    if (!library) {
        return [];
    }
    // library.Tokens === _Rooms_
    // library.Tokens[number].Payload.IsSealed === _is not unlocked_
    // library.Tokens[number].Payload.IsShrouded === _can't be unlocked_
    return library.tokens.filter((room) => {
        const payload = room.payload;
        if (payload.$type === "elementstackcreationcommand" ||
            payload.$type === "situationcreationcommand") {
            return false;
        }
        return !payload.issealed && !payload.isshrouded;
    });
}
function getUnlockableRoomsFromSave(json) {
    // TODO: rewrite this
    // FIXME: can't keep track of parent relationships due to filtering arrays
    const library = json.rootpopulationcommand.spheres.find((sphere) => sphere.governingspherespec.id === "library");
    if (!library) {
        return [];
    }
    // library.Tokens === _Rooms_
    // library.Tokens[number].Payload.IsSealed === _is not unlocked_
    // library.Tokens[number].Payload.IsShrouded === _can't be unlocked_
    return library.tokens.filter((room) => {
        const payload = room.payload;
        if (payload.$type === "elementstackcreationcommand" ||
            payload.$type === "situationcreationcommand") {
            return false;
        }
        return !payload.issealed && payload.isshrouded;
    });
}
function getVerbsFromSave() {
    // TODO: rewrite this
    return save.rooms.values().flatMap((room) => {
        // const roomX = room.location.localposition.x;
        // const roomY = room.location.localposition.y;
        // const roomName = room.payload.id;
        const itemDomain = room.payload.dominions.find((dominion) => dominion.identifier === "roomcontentsdominion");
        if (!itemDomain) {
            return [];
        }
        const verbs = itemDomain.spheres.flatMap(sphere => sphere.tokens
            .map(token => token.payload)
            .filter(payload => payload.$type === "situationcreationcommand"));
        return verbs.map(payload => payload.verbid);
    });
}
function getDecksFromSave(json) {
    return json.rootpopulationcommand.dealerstable.spheres.map(deckData => {
        const name = deckData.governingspherespec.actionid;
        const cards = deckData.tokens.map(card => {
            if (card.payload.$type !== "elementstackcreationcommand") {
                return undefined;
            }
            return card.payload.entityid;
        }).filter(card => card !== undefined);
        return [name, cards];
    });
}
function getItemsFromSave() {
    // TODO: rewrite this
    return save.rooms.values()
        .flatMap(room => {
        // const roomX = room.location.localposition.x;
        // const roomY = room.location.localposition.y;
        const roomName = room.payload.id;
        const itemDomain = room.payload.dominions.find((dominion) => dominion.identifier === "roomcontentsdominion");
        if (!itemDomain) {
            return [];
        }
        // TODO: check if $type === "ElementStackCreationCommand" could be an easier way to find this
        const containers = itemDomain.spheres.filter((container) => {
            // FIXME: false negatives
            // the others are strange
            return ["bookshelf", "wallart", "things", "comfort"].includes(container.governingspherespec.label);
        });
        // FIXME: filter out non stack items
        const allItems = containers.flatMap(container => {
            // TODO: move this to saveElementExtentionMerging
            const items = container.tokens
                .map(token => token.payload)
                .filter((item) => item.$type === "elementstackcreationcommand");
            const itemIds = items.map(item => {
                const aspects = [item.mutations, ...data.elements.getInheritedProperty(item.entityid, "aspects")];
                const mergedAspects = mergeAspects(aspects);
                // remove typing
                delete mergedAspects["$type"];
                return Object.assign({}, item, {
                    aspects: mergedAspects,
                    room: roomName,
                });
            });
            return itemIds;
        });
        return allItems;
    });
}
// utility
export function mergeAspects(aspects) {
    return aspects
        .map(aspect => Object.entries(aspect))
        .reduce((res, entries) => {
        for (const [aspect, count] of entries) {
            if (!res[aspect]) {
                res[aspect] = 0;
            }
            res[aspect] += count;
        }
        return res;
    }, {});
}
// filters
export const filterBuilders = {
    aspectFilter: (options, aspectFunc) => {
        return (item) => {
            const aspects = aspectFunc(item);
            for (const [aspect, amount] of Object.entries(options.min ?? {})) {
                const aspectCount = aspects[aspect];
                if (aspectCount === undefined || aspectCount < amount) {
                    return false;
                }
            }
            for (const [aspect, amount] of Object.entries(options.max ?? {})) {
                const aspectCount = aspects[aspect];
                if (aspectCount !== undefined && aspectCount > amount) {
                    return false;
                }
            }
            if (options.any &&
                Object.entries(options.any).length > 0 &&
                !Object.entries(options.any).some(([aspect, amount]) => {
                    const aspectCount = aspects[aspect];
                    return !(aspectCount === undefined || aspectCount < amount);
                })) {
                return false;
            }
            return true;
        };
    },
    /*
        basicItemFilter: (options: types.itemSearchOptions): ((item: element) => boolean) => {
            return (item: element): boolean => {
                if (options.nameInvalid?.test(item.entityid)) {return false;}
                if (options.nameValid && !options.nameValid.test(item.entityid)) {return false;}
                return aspectFilter(options, item.aspects);
            };
        },
        basicRecipeFilter: (options: types.itemSearchOptions): ((item: types.dataRecipe) => boolean) => {
            return (item: types.dataRecipe): boolean => {
                if (options.nameInvalid?.test(item.id)) {return false;}
                if (options.nameValid && !options.nameValid.test(item.id)) {return false;}
                return aspectFilter(options, item.reqs??{});
            };
        },
    };
    */
};
