import PolarisActorBase from "./base-actor.mjs";

export default class PolarisNPC extends PolarisActorBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.cr = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.xp = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });

    // NPC Attributes
    schema.attributes = new fields.SchemaField({
      size: new fields.StringField({ required: true, blank: true, initial: "Medium" }),
      type: new fields.StringField({ required: true, blank: true, initial: "Humanoid" }),
      alignment: new fields.StringField({ required: true, blank: true, initial: "Neutral" })
    });

    // Abilities (simplified for NPCs)
    schema.abilities = new fields.SchemaField({
      FOR: new fields.NumberField({ ...requiredInteger, initial: 10, min: 0, max: 30 }),
      CON: new fields.NumberField({ ...requiredInteger, initial: 10, min: 0, max: 30 }),
      COO: new fields.NumberField({ ...requiredInteger, initial: 10, min: 0, max: 30 }),
      ADA: new fields.NumberField({ ...requiredInteger, initial: 10, min: 0, max: 30 }),
      PER: new fields.NumberField({ ...requiredInteger, initial: 10, min: 0, max: 30 }),
      INT: new fields.NumberField({ ...requiredInteger, initial: 10, min: 0, max: 30 }),
      VOL: new fields.NumberField({ ...requiredInteger, initial: 10, min: 0, max: 30 }),
      PRE: new fields.NumberField({ ...requiredInteger, initial: 10, min: 0, max: 30 })
    });

    // Defense
    schema.defense = new fields.SchemaField({
      armor: new fields.NumberField({ ...requiredInteger, initial: 10 }),
      dodge: new fields.NumberField({ ...requiredInteger, initial: 10 })
    });

    // Movement
    schema.movement = new fields.SchemaField({
      ground: new fields.StringField({ required: true, blank: true, initial: "6m" }),
      other: new fields.StringField({ required: true, blank: true, initial: "" })
    });

    // Skills (as a single text field for flexibility)
    schema.skills = new fields.StringField({ required: true, blank: true, initial: "" });

    // Attacks (array of attacks)
    schema.attacks = new fields.ArrayField(new fields.SchemaField({
      name: new fields.StringField({ required: true, blank: true }),
      type: new fields.StringField({ required: true, blank: true, initial: "Melee" }),
      bonus: new fields.NumberField({ ...requiredInteger, initial: 0 }),
      damage: new fields.StringField({ required: true, blank: true }),
      damageType: new fields.StringField({ required: true, blank: true }),
      range: new fields.StringField({ required: true, blank: true }),
      description: new fields.StringField({ required: true, blank: true })
    }));

    // Special Abilities
    schema.specialAbilities = new fields.ArrayField(new fields.SchemaField({
      name: new fields.StringField({ required: true, blank: true }),
      description: new fields.StringField({ required: true, blank: true })
    }));

    // Actions
    schema.actions = new fields.StringField({ required: true, blank: true, initial: "" });

    // Reactions
    schema.reactions = new fields.StringField({ required: true, blank: true, initial: "" });

    // Notes
    schema.notes = new fields.StringField({ required: true, blank: true, initial: "" });

    return schema;
  }

  prepareDerivedData() {
    // Calculate XP based on CR
    this.xp = this.cr * this.cr * 100;

    // Calculate ability modifiers for NPCs
    this.abilityMods = {};
    if (this.abilities) {
      for (const [key, value] of Object.entries(this.abilities)) {
        const mod = Math.floor((value - 10) / 2);
        this.abilityMods[key] = mod >= 0 ? `+${mod}` : `${mod}`;
      }
    }
  }

  getRollData() {
    const data = {};

    // Copy abilities to roll data
    if (this.abilities) {
      for (let [k, v] of Object.entries(this.abilities)) {
        data[k] = { value: v, mod: Math.floor((v - 10) / 2) };
      }
    }

    data.cr = this.cr;
    data.xp = this.xp;

    return data;
  }
}

