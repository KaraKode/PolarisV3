import PolarisActorBase from "./base-actor.mjs";

export default class PolarisCharacter extends PolarisActorBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.attributes = new fields.SchemaField({
      level: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 1 })
      }),
    });

    // Iterate over ability names and create a new SchemaField for each.
    schema.abilities = new fields.SchemaField(Object.keys(CONFIG.Polaris.abilities).reduce((obj, ability) => {
      obj[ability] = new fields.SchemaField({
        base: new fields.NumberField({ ...requiredInteger, initial: 7, min: 0, max: 20 }),           // Basic skill
        genetic: new fields.NumberField({ ...requiredInteger, initial: 0, min: -5, max: 5 }),         // Genetic modifier
        creation: new fields.NumberField({ ...requiredInteger, initial: 0, min: -5, max: 10 }),       // Creation points modifier
        value: new fields.NumberField({ ...requiredInteger, initial: 10, min: 3, max: 20 }),          // Actual skill (calculated)
        aptitude: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 10 }),        // Natural aptitude
        mod: new fields.NumberField({ ...requiredInteger, initial: 0 })                               // Modifier for rolls
      });
      return obj;
    }, {}));

    // Secondary abilities - calculated from primary abilities
    schema.secondaryAbilities = new fields.SchemaField({
      // Shock resistance
      shock: new fields.SchemaField({
        numbnessThreshold: new fields.NumberField({ ...requiredInteger, initial: 0 }),      // Numbness threshold
        unconsciousnessThreshold: new fields.NumberField({ ...requiredInteger, initial: 0 }) // Unconsciousness threshold
      }),
      // Damage modifier (CAC - Close Combat)
      damageModifier: new fields.SchemaField({
        cac: new fields.NumberField({ ...requiredInteger, initial: 0 })                     // Melee damage modifier
      }),
      // Reaction
      reaction: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0 })                   // (ADA + PER) / 2
      }),
      // Damage resistance
      damageResistance: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0 })                   // Base damage resistance
      }),
      // Natural resistance
      naturalResistance: new fields.SchemaField({
        drugs: new fields.NumberField({ ...requiredInteger, initial: 0 }),                  // (CON + VOL) / 2
        sickness: new fields.NumberField({ ...requiredInteger, initial: 0 }),               // CON
        poison: new fields.NumberField({ ...requiredInteger, initial: 0 }),                 // CON
        radiation: new fields.NumberField({ ...requiredInteger, initial: 0 })               // CON
      }),
      // Breath
      breath: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0 })                   // (CON + VOL) / 2
      })
    });

    // Luck skill - special attribute
    schema.luck = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 10, min: 0, max: 20 }),
      mod: new fields.NumberField({ ...requiredInteger, initial: 0 })
    });

    // Physical description
    schema.physical = new fields.SchemaField({
      height: new fields.StringField({ required: true, blank: true, initial: "" }),           // Height
      weight: new fields.StringField({ required: true, blank: true, initial: "" }),           // Weight
      skinColor: new fields.StringField({ required: true, blank: true, initial: "" }),        // Skin color
      bodySize: new fields.StringField({ required: true, blank: true, initial: "" }),         // Body size/build
      hairColor: new fields.StringField({ required: true, blank: true, initial: "" }),        // Hair color
      eyeColor: new fields.StringField({ required: true, blank: true, initial: "" }),         // Eye color
      dominantHand: new fields.StringField({ required: true, blank: true, initial: "Right" }), // Dominant hand
      particularSigns: new fields.StringField({ required: true, blank: true, initial: "" }),  // Particular signs/marks
      archetype: new fields.StringField({ required: true, blank: true, initial: "" }),        // Archetype
      geneticType: new fields.StringField({ required: true, blank: true, initial: "" }),      // Genetic type
      age: new fields.StringField({ required: true, blank: true, initial: "" }),              // Age
      sex: new fields.StringField({ required: true, blank: true, initial: "" }),              // Sex
      fertility: new fields.StringField({ required: true, blank: true, initial: "" }),        // Fertility
      geographicalOrigin: new fields.StringField({ required: true, blank: true, initial: "" }), // Geographical origin
      socialOrigin: new fields.StringField({ required: true, blank: true, initial: "" }),     // Social origin
      schoolBase: new fields.StringField({ required: true, blank: true, initial: "" }),       // Base school
      highSchool: new fields.StringField({ required: true, blank: true, initial: "" })        // High school
    });

    return schema;
  }

  prepareDerivedData() {
    // Loop through ability scores, and add their modifiers to our sheet output.
    for (const key in this.abilities) {
      const ability = this.abilities[key];

      // Calculate actual skill value: base + genetic + creation
      ability.value = ability.base + ability.genetic + ability.creation;

      // Ensure value stays within bounds
      ability.value = Math.max(3, Math.min(20, ability.value));

      // Calculate the modifier using d20 rules.
      ability.mod = Math.floor((ability.value - 10) / 2);

      // Handle ability label localization.
      ability.label = game.i18n.localize(CONFIG.Polaris.abilities[key]) ?? key;
    }

    // Calculate luck modifier
    if (this.luck) {
      this.luck.mod = Math.floor((this.luck.value - 10) / 2);
    }

    // Calculate secondary abilities
    if (this.secondaryAbilities && this.abilities) {
      const CON = this.abilities.CON?.value || 10;
      const FOR = this.abilities.FOR?.value || 10;
      const ADA = this.abilities.ADA?.value || 10;
      const PER = this.abilities.PER?.value || 10;
      const VOL = this.abilities.VOL?.value || 10;

      // Shock resistance thresholds
      this.secondaryAbilities.shock.numbnessThreshold = Math.floor(FOR + CON + VOL / 2);
      this.secondaryAbilities.shock.unconsciousnessThreshold = this.secondaryAbilities.shock.numbnessThreshold + 10;

      // Damage modifier (CAC - melee) based on Force table
      // FOR 1-2:-6, 3-4:-4, 5-6:-2, 7-8:-1, 9-11:0, 12-13:+1, 14-15:+2, 16-17:+3, 18-19:+4, 20-21:+5, 22+:+1 per 2
      let cacModifier = 0;
      if (FOR <= 2) cacModifier = -6;
      else if (FOR <= 4) cacModifier = -4;
      else if (FOR <= 6) cacModifier = -2;
      else if (FOR <= 8) cacModifier = -1;
      else if (FOR <= 11) cacModifier = 0;
      else if (FOR <= 13) cacModifier = 1;
      else if (FOR <= 15) cacModifier = 2;
      else if (FOR <= 17) cacModifier = 3;
      else if (FOR <= 19) cacModifier = 4;
      else if (FOR <= 21) cacModifier = 5;
      else {
        // FOR 22+: +1 for every 2 points above 20
        cacModifier = 5 + Math.floor((FOR - 20) / 2);
      }
      this.secondaryAbilities.damageModifier.cac = cacModifier;

      // Reaction: (ADA + PER) / 2
      this.secondaryAbilities.reaction.value = Math.floor((ADA + PER) / 2);

      // Damage resistance (base value, can be modified by armor/effects)
      this.secondaryAbilities.damageResistance.value = 0; // Base is 0, modified by equipment

      // Natural resistance
      this.secondaryAbilities.naturalResistance.drugs = Math.floor((CON + VOL) / 2);
      this.secondaryAbilities.naturalResistance.sickness = CON;
      this.secondaryAbilities.naturalResistance.poison = CON;
      this.secondaryAbilities.naturalResistance.radiation = CON;

      // Breath: (CON + VOL) / 2
      this.secondaryAbilities.breath.value = Math.floor((CON + VOL) / 2);
    }
  }

  getRollData() {
    const data = {};

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@FOR.mod + 4`.
    if (this.abilities) {
      for (let [k, v] of Object.entries(this.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    data.lvl = this.attributes.level.value;

    // Add luck to roll data
    if (this.luck) {
      data.luck = foundry.utils.deepClone(this.luck);
    }

    return data;
  }
}

