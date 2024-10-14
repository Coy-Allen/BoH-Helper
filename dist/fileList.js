// FIXME: determine if DLC is installed to not crash on missing files
const fileMetaDataList = [
    // TODO: decks
    { name: "decks\\catalogue_decks.json", encoding: "utf8", type: "decks" },
    { name: "decks\\challenges.json", encoding: "utf8", type: "decks" },
    { name: "decks\\chats.json", encoding: "utf8", type: "decks" },
    { name: "decks\\DLC_HOL_inkling.json", encoding: "utf8", type: "decks" },
    { name: "decks\\gathering_decks.json", encoding: "utf8", type: "decks" },
    { name: "decks\\incidents_decks.json", encoding: "utf8", type: "decks" },
    { name: "elements\\aspecteditems.json", encoding: "utf16le", type: "items" },
    { name: "elements\\tomes.json", encoding: "utf16le", type: "items", postProcessing: text => text.replaceAll("\n", "") }, // journalofsirdavidgreene1903 has enters in it's string instead of \n
    { name: "elements\\_prototypes.json", encoding: "utf8", type: "items" }, // _ability.fatigued os also in another file
    { name: "elements\\journal.json", encoding: "utf8", type: "items" },
    { name: "elements\\correspondence_elements.json", encoding: "utf8", type: "items" },
    { name: "elements\\_aspects_salons.json", encoding: "utf8", type: "items" },
    { name: "elements\\_aspects.json", encoding: "utf8", type: "items" },
    { name: "elements\\_debug.json", encoding: "utf8", type: "items" },
    { name: "elements\\_evolutionaspects.json", encoding: "utf8", type: "items" },
    { name: "elements\\_groupaspects.json", encoding: "utf8", type: "items" },
    { name: "elements\\_order_aspects.json", encoding: "utf8", type: "items" },
    { name: "elements\\_resolutionaspects.json", encoding: "utf8", type: "items" },
    { name: "elements\\_visitactedaspects.json", encoding: "utf16le", type: "items" },
    { name: "elements\\_visitaspects.json", encoding: "utf8", type: "items" },
    { name: "elements\\_visitreadaspects.json", encoding: "utf8", type: "items" },
    { name: "elements\\abilities_setup.json", encoding: "utf8", type: "items" },
    { name: "elements\\abilities.json", encoding: "utf8", type: "items" }, // _ability.fatigued os also in another file
    { name: "elements\\abilities2.json", encoding: "utf8", type: "items" },
    { name: "elements\\abilities3.json", encoding: "utf8", type: "items" },
    { name: "elements\\abilities4.json", encoding: "utf8", type: "items" },
    { name: "elements\\aspects_nx.json", encoding: "utf8", type: "items" },
    { name: "elements\\assistance.json", encoding: "utf8", type: "items" },
    { name: "elements\\celestial.json", encoding: "utf8", type: "items" },
    { name: "elements\\challenge_opportunities.json", encoding: "utf8", type: "items" },
    { name: "elements\\circumstances.json", encoding: "utf8", type: "items" },
    { name: "elements\\comforts.json", encoding: "utf8", type: "items" },
    { name: "elements\\contamination_aspects.json", encoding: "utf8", type: "items" },
    { name: "elements\\correspondence _addresses.json", encoding: "utf8", type: "items" },
    { name: "elements\\credits.json", encoding: "utf8", type: "items" },
    { name: "elements\\DLC_HOL_instituteaspects_ally.json", encoding: "utf16le", type: "items" },
    { name: "elements\\DLC_HOL_instituteaspects_foe.json", encoding: "utf16le", type: "items" },
    { name: "elements\\DLC_HOL_instituteaspects_mission.json", encoding: "utf16le", type: "items" },
    { name: "elements\\DLC_HOL_manuscripts.json", encoding: "utf16le", type: "items" },
    { name: "elements\\DLC_HOL_meddling.json", encoding: "utf16le", type: "items" },
    { name: "elements\\DLC_HOL_menu.json", encoding: "utf8", type: "items" },
    { name: "elements\\DLC_HOL_misc.json", encoding: "utf16le", type: "items" },
    { name: "elements\\DLC_HOL_ns.json", encoding: "utf16le", type: "items" },
    { name: "elements\\DLC_HOL_salons.json", encoding: "utf16le", type: "items" },
    { name: "elements\\DLC_HOL_stagger_elements.json", encoding: "utf16le", type: "items" },
    { name: "elements\\incidents_n.json", encoding: "utf8", type: "items" }, // affair.box dupe record
    { name: "elements\\incidents_weather.json", encoding: "utf8", type: "items" },
    { name: "elements\\misc.json", encoding: "utf8", type: "items" },
    { name: "elements\\music.json", encoding: "utf8", type: "items" },
    { name: "elements\\physical_sphere_text.json", encoding: "utf8", type: "items" },
    { name: "elements\\precursors.json", encoding: "utf8", type: "items" },
    { name: "elements\\pseudoaspectpreviewtooltips.json", encoding: "utf8", type: "items" },
    { name: "elements\\resources.json", encoding: "utf8", type: "items" },
    { name: "elements\\skills_r.json", encoding: "utf8", type: "items" },
    { name: "elements\\skills.json", encoding: "utf8", type: "items" },
    { name: "elements\\tips_hints.json", encoding: "utf8", type: "items" },
    { name: "elements\\tlg.json", encoding: "utf8", type: "items" },
    { name: "elements\\visitors_embarking.json", encoding: "utf8", type: "items" },
    { name: "elements\\visitors_other.json", encoding: "utf8", type: "items" },
    { name: "elements\\visitors_retired.json", encoding: "utf8", type: "items" },
    { name: "elements\\visitors.json", encoding: "utf8", type: "items" },
    { name: "elements\\xlessons_unique.json", encoding: "utf8", type: "items" },
    { name: "elements\\xlessons.json", encoding: "utf8", type: "items" },
    { name: "elements\\uncats.json", encoding: "utf8", type: "items" },
    { name: "recipes\\__debug.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\_backstops.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\_collections.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\_endings_0_histories_present.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\_endings_0_histories_unusual_present_record.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\_endings_1_histories_record.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\_endings_2_determinations.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\_histories_hints.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\_intercepts.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\_legacy_crafting_4a_prenticeplus_ambittable_unfriendly.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\_legacy_crafting_obsolete.json", encoding: "utf8", type: "recipes" }, // craft.keeper.insects.nectars_moth_larva.chimeric_perilous imago is also in another file
    { name: "recipes\\_legacy.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\_startup_recipes.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\0_consider_decontaminations.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\1_consider_books.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\2a_consider_open.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\2b_consider_generic.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\2c_consider_resolve.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\beasts.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\bookbinding.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\celestial_recipes_time.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\celestial_recipes_weather.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\correspondence_ordering.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\correspondence.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\crafting_0_numina.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\crafting_0_rest.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\crafting_1_chandlery.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\crafting_1_evolutions.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\crafting_1_simplemanipulations.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\crafting_2_keeper.json", encoding: "utf8", type: "recipes" }, // craft.keeper.insects.nectars_moth_larva.chimeric_perilous imago is also in another file
    { name: "recipes\\crafting_3_scholar.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\crafting_4b_prentice.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\DLC_HOL_1_lighthouse.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\DLC_HOL_1_meddling.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\DLC_HOL_1a_salons_inauguration_end.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\DLC_HOL_1b_salons_inauguration_ally_foe.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\DLC_HOL_1b_salons_inauguration_mission.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\DLC_HOL_2a_salons_blockers_basic.json", encoding: "utf16le", type: "recipes" }, // salon.hint.guests dupe records x2
    { name: "recipes\\DLC_HOL_2b_salons_blockers_beverages.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\DLC_HOL_2c_salons_blockers_repasts.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\DLC_HOL_3_salons_prototypes.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\DLC_HOL_3b_salons_routing.json", encoding: "utf16le", type: "recipes" }, // lastresortfallthroughslnev is also in another file
    { name: "recipes\\DLC_HOL_cooking.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\DLC_HOL_correspondence_summoning.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\DLC_HOL_gathering_2_seasonal.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\DLC_HOL_interactions_specific.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\DLC_HOL_leiter.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\DLC_HOL_manuscripting_soph_improve.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\DLC_HOL_manuscripting_soph_set.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\DLC_HOL_manuscripting_write.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\DLC_HOL_nrs.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\DLC_HOL_patch_resurrect_incidents.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\DLC_HOL_prototype_recipes.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\DLC_HOL_salon_responses.json", encoding: "utf16le", type: "recipes" }, // lastresortfallthroughslnev is also in another file
    { name: "recipes\\DLC_HOL_slnbk_languages.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\DLC_HOL_slnbk_skillls.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\DLC_HOL_slnbk_skills.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\DLC_HOL_understanding_specific.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\DLC_HOL_village_invitations.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\gathering_1_exceptional.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\gathering_2_seasonal.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\other_activities.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\renounce.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\talk_1_visitors.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\talk_2_visitors_payments_tutoring.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\talk_3a_visitors_intercepts.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\talk_3b_visitors_cantread.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\talk_4a_visitors_intros.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\talk_4b_visitors_specific_incidents.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\talk_5_visitors_generic_consultations.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\talk_5z_visitors_fallthrough_hints.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\talk_6_assistance.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\terrain.json", encoding: "utf16le", type: "recipes" },
    { name: "recipes\\understanding_1_numa.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\understanding_2_upskill.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\village_interactions.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\visitors_correspondence_auctions.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\wisdom_commitments_exotic.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\wisdom_commitments.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\z_fallthrough_hints.json", encoding: "utf8", type: "recipes" },
    { name: "recipes\\z_fallthrough_placeholders.json", encoding: "utf8", type: "recipes" },
    { name: "verbs\\celestial.json", encoding: "utf8", type: "verbs" }, // strange format. might exclude to make logic easier
    { name: "verbs\\incidents.json", encoding: "utf8", type: "verbs" }, // strange format. might exclude to make logic easier
    { name: "verbs\\DLC_HOL_verbs.json", encoding: "utf8", type: "verbs" },
    { name: "verbs\\librarian.json", encoding: "utf8", type: "verbs" },
    { name: "verbs\\workstations_beds.json", encoding: "utf8", type: "verbs" },
    { name: "verbs\\workstations_gathering.json", encoding: "utf8", type: "verbs" },
    { name: "verbs\\workstations_legacy.json", encoding: "utf8", type: "verbs" },
    { name: "verbs\\workstations_library_world.json", encoding: "utf8", type: "verbs" },
    { name: "verbs\\workstations_unusual.json", encoding: "utf8", type: "verbs" },
    { name: "verbs\\workstations_upgraded.json", encoding: "utf8", type: "verbs" },
    { name: "verbs\\workstations_village.json", encoding: "utf8", type: "verbs" },
];
export default fileMetaDataList;
