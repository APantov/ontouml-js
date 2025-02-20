import { Ontouml2Alloy } from '@libs/ontouml2alloy/index';
import { Class, OntoumlElement, Package, Project, Relation } from '@libs/ontouml';
import { getNormalizedName } from '@libs/ontouml2alloy/util';
import { generateAlloy, generateFact, generateWorldFieldForClass, generateWorldFact } from './helpers';
import { OntoumlType } from '@libs/ontouml';
import { reservedKeywords, forbiddenCharacters } from '@libs/ontouml2alloy/util';


describe('Name normalization' , () => {

    let element: OntoumlElement;
    let project: Project;
    let model: Package;
    let transformer: Ontouml2Alloy;

    beforeEach(() => {
    project = new Project();
    model = project.createModel();
    transformer = new Ontouml2Alloy(model);
    element = new Class();
    });
    
    describe('Original name is kept when there are no issues' , () => {
    
        it('Person -> Person', () => {
            element.addName('Person');
            const normalized = getNormalizedName(transformer, element);
            expect(normalized).toBe('Person');
          });
        
          it('PERSON -> PERSON', () => {
            element.addName('PERSON');
            const normalized = getNormalizedName(transformer, element);
            expect(normalized).toBe('PERSON');
          });
        
          it('person -> person', () => {
            element.addName('person');
            const normalized = getNormalizedName(transformer, element);
            expect(normalized).toBe('person');
          });
        
          it('PeRsoN -> PeRsoN', () => {
            element.addName('PeRsoN');
            const normalized = getNormalizedName(transformer, element);
            expect(normalized).toBe('PeRsoN');
          });
    
    })
    
    describe("Inappropriate names are normalized properly", () => {
            
        //normalization of reserved keywords: abstract -> abstract_OntoumlElementType
        reservedKeywords.forEach(keyword => {
            it(`should normalize the reserved keyword "${keyword}"`, () => {
                element.addName(keyword);
                const normalized = getNormalizedName(transformer, element);
                expect(normalized).toBe(`${keyword}_${(element.type).toLowerCase()}`);
            });
        });
    
        forbiddenCharacters.forEach(char => {
            it(`should remove the forbidden character "${char}" from the name`, () => {
                element.addName(`Happy${char}Person`);
                const normalized = getNormalizedName(transformer, element);
                expect(normalized).toBe('HappyPerson');
            });
        });

        //normalization of empty name: '' -> Unnamed_OntoumlElementType; 
        it('should normalize a class with no name', () => {
            element.addName('');
            const normalized = getNormalizedName(transformer, element);
            expect(normalized).toBe('class');
        });

        it('should normalize a relation with no name', () => {
            element = new Relation();
            element.addName('');
            const normalized = getNormalizedName(transformer, element);
            expect(normalized).toBe('relation');
        });

        it('should transform a relation between datatypes', () => {
            const sourceClass = model.createDatatype('Date');
            const targetClass = model.createDatatype('String');
            const relation = model.createBinaryRelation(sourceClass, targetClass);
    
            const result = generateAlloy(model);
    
            expect(result).toContain('sig Date in Datatype {\n        relation: String\n}');
        });

        it('should normalize two classes with no name/only forbidden characters', () => {
            const element1 = model.createKind('');
            const element2 = model.createKind('!!!');
            const normalized1 = getNormalizedName(transformer, element1);
            const normalized2 = getNormalizedName(transformer, element2);

            expect(normalized1).toBe('class');
            expect(normalized2).toBe('class1');
        });
    
        it('should normalize two classes with same name', () => {
            model.createKind('Person');
            model.createKind('Person');
            const result = generateAlloy(model);

            expect(result).toContain(generateFact('rigid',['rigidity[Person,Object,exists]']));
            expect(result).toContain(generateFact('rigid',['rigidity[Person1,Object,exists]']));
            expect(result).toContain(generateWorldFieldForClass('Person','Object'));
            expect(result).toContain(generateWorldFieldForClass('Person1','Object'));
            expect(result).toContain(generateWorldFact('Person+Person1','Object'));
        })

        it('should normalize a class starting with a number', () => {
            element.addName('123Person');
            const normalized = getNormalizedName(transformer, element);
            expect(normalized).toBe('class_123Person');
        });
    
    });



}) 


