import PolarisActorBase from './base-actor.mjs';

export default class PolarisCharacter extends PolarisActorBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.attributes = new fields.SchemaField({
      level: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 1, min: 1 }),
      }),
      chance: new fields.SchemaField({
        base: new fields.NumberField({ ...requiredInteger, initial: 10, min: 0 }),
        genetic: new fields.NumberField({ ...requiredInteger, initial: 0, min: -5, max: 5 }),
        creation: new fields.NumberField({ ...requiredInteger, initial: 0, min: -5, max: 10 }),
        aptitude: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 10 }),
        value: new fields.NumberField({ ...requiredInteger, initial: 10, min: 0 }),
      }),
    });

    // Character details
    schema.details = new fields.SchemaField({
      archetype: new fields.StringField({ required: true, blank: true, initial: "" }),
      geneticType: new fields.StringField({ required: true, blank: true, initial: "" }),
      age: new fields.NumberField({ ...requiredInteger, initial: 25, min: 0 }),
      sex: new fields.StringField({ required: true, blank: true, initial: "" }),
      fertility: new fields.StringField({ 
        required: true, 
        blank: false, 
        initial: "fecond",
        choices: ["fecond", "sterile"]
      }),
      geographicOrigin: new fields.StringField({ required: true, blank: true, initial: "" }),
      socialOrigin: new fields.StringField({ required: true, blank: true, initial: "" }),
      basicTraining: new fields.StringField({ required: true, blank: true, initial: "" }),
      higherEducation: new fields.StringField({ required: true, blank: true, initial: "" }),
    });

    // Physical description
    schema.physical = new fields.SchemaField({
      height: new fields.StringField({ required: true, blank: true, initial: "" }),
      weight: new fields.StringField({ required: true, blank: true, initial: "" }),
      skin: new fields.StringField({ required: true, blank: true, initial: "" }),
      corpulence: new fields.StringField({ required: true, blank: true, initial: "" }),
      hair: new fields.StringField({ required: true, blank: true, initial: "" }),
      eyes: new fields.StringField({ required: true, blank: true, initial: "" }),
      distinguishingMarks: new fields.StringField({ required: true, blank: true, initial: "" }),
    });

    // Secondary attributes
    schema.secondaryAttributes = new fields.SchemaField({
      REA: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
      }),
      MDCC: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
      }),
      RAC: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
      }),
      RAD: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
      }),
      RN: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
      }),
      SOU: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
      }),
    });

    // Skills arrays (30 skills per column as shown in the image)
    const skillSchema = new fields.SchemaField({
      name: new fields.StringField({ required: true, blank: true, initial: "" }),
      attribute: new fields.StringField({ 
        required: true, 
        blank: false, 
        initial: "FOR",
        choices: ["FOR", "CON", "COO", "ADA", "PER", "INT", "VOL", "PRE"]
      }),
      base: new fields.NumberField({ ...requiredInteger, initial: 0 }),
      mod: new fields.NumberField({ ...requiredInteger, initial: 0 }),
      trained: new fields.BooleanField({ required: true, initial: false }),
      total: new fields.NumberField({ ...requiredInteger, initial: 0 }),
    });

    schema.skills1 = new fields.ArrayField(skillSchema, { initial: () => {
      const skills = [];
      for (let i = 0; i < 30; i++) {
        skills.push({
          name: "",
          attribute: "FOR",
          base: 0,
          mod: 0,
          trained: false,
          total: 0
        });
      }
      return skills;
    }});

    schema.skills2 = new fields.ArrayField(skillSchema, { initial: () => {
      const skills = [];
      for (let i = 0; i < 30; i++) {
        skills.push({
          name: "",
          attribute: "FOR",
          base: 0,
          mod: 0,
          trained: false,
          total: 0
        });
      }
      return skills;
    }});

    return schema;
  }

  prepareDerivedData() {
    // Calculate chance attribute value
    if (this.attributes?.chance) {
      this.attributes.chance.value = 
        this.attributes.chance.base + 
        this.attributes.chance.genetic + 
        this.attributes.chance.creation;
    }

    // Calculate skill totals
    if (this.skills1) {
      this.skills1.forEach(skill => {
        if (skill.attribute && this.abilities[skill.attribute]) {
          const attributeValue = this.abilities[skill.attribute].value || 0;
          skill.total = skill.base + skill.mod + attributeValue;
        }
      });
    }

    if (this.skills2) {
      this.skills2.forEach(skill => {
        if (skill.attribute && this.abilities[skill.attribute]) {
          const attributeValue = this.abilities[skill.attribute].value || 0;
          skill.total = skill.base + skill.mod + attributeValue;
        }
      });
    }

    super.prepareDerivedData();
  }

  getRollData() {
    const data = {};

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (this.abilities) {
      for (let [k, v] of Object.entries(this.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    data.lvl = this.attributes.level.value;

    return data;
  }
}

