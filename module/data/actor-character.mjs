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
        base: new fields.NumberField({ ...requiredInteger, initial: 10, min: 0, max: 20 }),           // Basic skill
        genetic: new fields.NumberField({ ...requiredInteger, initial: 0, min: -5, max: 5 }),         // Genetic modifier
        creation: new fields.NumberField({ ...requiredInteger, initial: 0, min: -5, max: 10 }),       // Creation points modifier
        value: new fields.NumberField({ ...requiredInteger, initial: 10, min: 3, max: 20 }),          // Actual skill (calculated)
        aptitude: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 10 }),        // Natural aptitude
        mod: new fields.NumberField({ ...requiredInteger, initial: 0 })                               // Modifier for rolls
      });
      return obj;
    }, {}));

    // Iterate over secondary attributes and create a new SchemaField for each.
    schema.Secondary = new fields.SchemaField(Object.keys(CONFIG.Polaris.secondary).reduce((obj, secondary) => {
      obj[secondary] = new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 10 })
      });
      return obj;
    }, {}));

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

    return data;
  }
}

