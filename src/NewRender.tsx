/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import axios from "axios";

interface IAttribute {
  type: string;
  value: string;
}

interface IVariation {
  id: string;
  attributes: IAttribute[];
}

interface IAttributeChoices {
  type: string;
  allValues: string[];
  availableValues: string[];
}

const NewRender = () => {
  const productIdInputRef = useRef<HTMLInputElement>(null);
  const [variations, setVariations] = useState<IVariation[]>([]);
  const [noVariations, setNoVariations] = useState<boolean>(false);
  const [attributeChoices, setAttributeChoices] = useState<IAttributeChoices[]>(
    []
  );
  const [chosenAttributes, setChosenAttributes] = useState<string[]>([]);
  const [chosenVariation, setChosenVariation] = useState<
    IVariation | undefined
  >(undefined);

  const parseVariations = (variations: IVariation[]) => {
    return variations.map((variation: IVariation) => {
      return {
        id: variation.id,
        attributes: variation.attributes.map((attribute: any) => {
          const parsedAttribute: IAttribute = {
            type: attribute.name,
            value: attribute.option,
          };
          return parsedAttribute;
        }),
      };
    });
  };

  const getAttributeChoices = (variations: IVariation[]) => {
    const attributeChoices: IAttributeChoices[] = [];
    variations.forEach((variation) => {
      variation.attributes.forEach((attribute) => {
        const existingAttribute = attributeChoices.find(
          (choice) => choice.type === attribute.type
        );
        if (existingAttribute) {
          if (!existingAttribute.allValues.includes(attribute.value)) {
            existingAttribute.allValues.push(attribute.value);
          }
        } else {
          attributeChoices.push({
            type: attribute.type,
            allValues: [attribute.value],
            availableValues: [],
          });
        }
      });
    });
    return attributeChoices;
  };

  const fetchVariations = async (productId: number) => {
    try {
      const apiUrl = `http://localhost:3000/product/${productId}/variations`;
      const response = await axios.get(apiUrl);
      const _variations = parseVariations(response.data.data);
      const _attributeChoices = getAttributeChoices(_variations);

      if (_variations.length === 0) {
        setNoVariations(true);
        return;
      }

      setVariations(_variations);
      setAttributeChoices(_attributeChoices);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClick = (
    attribute: string,
    attributeIndex: number,
    attributeType: string
  ) => {
    const variationsWithChosenAttribute = variations.filter((variation) => {
      const checkForCurrentAttribute =
        variation.attributes.find(
          (attribute) => attribute.type === attributeType
        )?.value === attribute;

      if (chosenAttributes.length) {
        const newChosenAttributes = chosenAttributes.slice(0, attributeIndex);

        const checkForPrevChoicesArr = newChosenAttributes.map(
          (chosenAttribute) => {
            const att = attributeChoices.find((attribute) =>
              attribute.allValues.includes(chosenAttribute)
            );

            if (att) {
              const attType = att.type;

              const test2 =
                variation.attributes.find(
                  (attribute) => attribute.type === attType
                )?.value === chosenAttribute;

              return test2;
            }

            return false;
          }
        );

        const checkForPrevChoices = checkForPrevChoicesArr.every((t) => t);

        return checkForCurrentAttribute && checkForPrevChoices;
      } else {
        return checkForCurrentAttribute;
      }
    });

    const nextAttribute = attributeChoices[attributeIndex + 1];

    if (!nextAttribute) {
      setChosenAttributes([...chosenAttributes, attribute]);
      return;
    }

    const availableValues = nextAttribute.allValues.filter((value) => {
      return variationsWithChosenAttribute.some((variation) => {
        return (
          variation.attributes.find(
            (attribute) => attribute.type === nextAttribute.type
          )?.value === value
        );
      });
    });

    const updatedAttributeChoices = attributeChoices.map((choice, index) => {
      if (index === attributeIndex + 1) {
        return {
          ...choice,
          availableValues,
        };
      }
      return choice;
    });

    const updatedChosenAttributes = chosenAttributes.slice(0, attributeIndex);
    updatedChosenAttributes.push(attribute);

    setAttributeChoices(updatedAttributeChoices);
    setChosenAttributes(updatedChosenAttributes);
  };

  const getVariationIdOfChosenAttributes = () => {
    const variation = variations.find((variation) => {
      return variation.attributes.every((attribute, index) => {
        return attribute.value === chosenAttributes[index];
      });
    });

    setChosenVariation(variation);
  };

  useEffect(() => {
    getVariationIdOfChosenAttributes();
  }, [chosenAttributes]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "25px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <label htmlFor="productIdInput">Enter a product Id: </label>
        <input
          ref={productIdInputRef}
          id="productIdInput"
          name="productIdInput"
          type="number"
        />
        <button
          className="submit"
          onClick={() => {
            const productId = parseInt(productIdInputRef.current?.value || "");
            fetchVariations(productId);
          }}
        >
          Submit
        </button>
      </div>

      {noVariations && <p>No variations found for this product.</p>}

      {attributeChoices.length !== 0 && (
        <>
          {attributeChoices.map((attribute, attributeIndex) => (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "10px",
              }}
              key={attributeIndex}
            >
              {(attributeIndex === 0 || chosenAttributes[attributeIndex - 1]) &&
                attribute.allValues.map((attributeValue, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      handleClick(
                        attributeValue,
                        attributeIndex,
                        attribute.type
                      )
                    }
                    disabled={
                      attributeIndex !== 0 &&
                      !attribute.availableValues.includes(attributeValue)
                    }
                  >
                    {attributeValue}
                  </button>
                ))}
            </div>
          ))}
        </>
      )}

      {chosenVariation && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <p>Chosen Variation Id: </p>
          <h1>{chosenVariation.id}</h1>
        </div>
      )}
    </div>
  );
};

export default NewRender;
