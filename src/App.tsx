/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import "./App.css";
import axios from "axios";

interface IAttribute {
  type: string;
  value: string;
}

interface IVariation {
  id: string;
  attributes: IAttribute[];
}

function App() {
  const [coverTypes, setCoverTypes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [boxes, setBoxes] = useState<string[]>([]);
  const [availableBoxes, setAvailableBoxes] = useState<string[]>([]);
  const [parsedVariations, setParsedVariations] = useState<IVariation[]>([]);
  const [noVariations, setNoVariations] = useState<boolean>(false);
  const [chosenAttributes, setChosenAttributes] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);

  const productIdInputRef = useRef<HTMLInputElement>(null);

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

  const fetchVariations = async (productId: number) => {
    try {
      const apiUrl = `http://localhost:3000/product/${productId}/variations`;
      const response = await axios.get(apiUrl);
      const variations = parseVariations(response.data.data);

      if (variations.length === 0) {
        setNoVariations(true);
        return;
      }

      setNoVariations(false);

      const uniqueCoverTypes = variations
        .map((variation) => {
          return (
            variation.attributes.find(
              (attribute) => attribute.type === "covertype"
            )?.value || ""
          );
        })
        .filter((value, index, self) => self.indexOf(value) === index);

      const uniqueColors = variations
        .map((variation) => {
          return (
            variation.attributes.find((attribute) => attribute.type === "color")
              ?.value || ""
          );
        })
        .filter((value, index, self) => self.indexOf(value) === index);

      const uniqueBoxes = variations
        .map((variation) => {
          return (
            variation.attributes.find((attribute) => attribute.type === "box")
              ?.value || ""
          );
        })
        .filter((value, index, self) => self.indexOf(value) === index);

      setCoverTypes(uniqueCoverTypes);
      setColors(uniqueColors);
      setBoxes(uniqueBoxes);
      setParsedVariations(variations);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClick = (attribute: string, attributeType: string) => {
    if (attributeType === "covertype") {
      const variationsWithChosenCoverType = parsedVariations.filter(
        (variation) => {
          return (
            variation.attributes.find(
              (attribute) => attribute.type === "covertype"
            )?.value === attribute
          );
        }
      );

      const uniqueColors = variationsWithChosenCoverType
        .map((variation) => {
          return (
            variation.attributes.find((attribute) => attribute.type === "color")
              ?.value || ""
          );
        })
        .filter((value, index, self) => self.indexOf(value) === index);

      setAvailableColors(uniqueColors);
      setAvailableBoxes([]);
      setChosenAttributes([attribute, null, null]);
    } else if (attributeType === "color") {
      const variationsWithChosenCoverTypeAndColor = parsedVariations.filter(
        (variation) => {
          return (
            variation.attributes.find(
              (attribute) => attribute.type === "covertype"
            )?.value === chosenAttributes[0] &&
            variation.attributes.find((attribute) => attribute.type === "color")
              ?.value === attribute
          );
        }
      );

      const uniqueBoxes = variationsWithChosenCoverTypeAndColor
        .map((variation) => {
          return (
            variation.attributes.find((attribute) => attribute.type === "box")
              ?.value || ""
          );
        })
        .filter((value, index, self) => self.indexOf(value) === index);

      setAvailableBoxes(uniqueBoxes);
      setChosenAttributes([chosenAttributes[0], attribute, null]);
    } else {
      setChosenAttributes([
        chosenAttributes[0],
        chosenAttributes[1],
        attribute,
      ]);
    }
  };

  const getVariationIdOfChosenAttributes = () => {
    const chosenVariation = parsedVariations.find((variation) => {
      return (
        variation.attributes.find((attribute) => attribute.type === "covertype")
          ?.value === chosenAttributes[0] &&
        variation.attributes.find((attribute) => attribute.type === "color")
          ?.value === chosenAttributes[1] &&
        variation.attributes.find((attribute) => attribute.type === "box")
          ?.value === chosenAttributes[2]
      );
    });

    setChosenVariation(chosenVariation);
  };

  const clearChosenAttributes = () => {
    setChosenAttributes([null, null, null]);
    setParsedVariations([]);
    setChosenVariation(undefined);
    setAvailableColors([]);
    setAvailableBoxes([]);
    setNoVariations(false);
    setBoxes([]);
    setColors([]);
    setCoverTypes([]);
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

      {parsedVariations && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "10px",
          }}
        >
          {coverTypes.map((coverType, i) => (
            <button key={i} onClick={() => handleClick(coverType, "covertype")}>
              {coverType}
            </button>
          ))}
        </div>
      )}

      {noVariations && <p>No variations found for this product.</p>}

      {chosenAttributes[0] && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "10px",
          }}
        >
          {colors.map((color, i) => (
            <button
              key={i}
              onClick={() => handleClick(color, "color")}
              disabled={!availableColors.includes(color)}
            >
              {color}
            </button>
          ))}
        </div>
      )}

      {chosenAttributes[1] && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "10px",
          }}
        >
          {boxes.map((box, i) => (
            <button
              key={i}
              onClick={() => handleClick(box, "box")}
              disabled={!availableBoxes.includes(box)}
            >
              {box}
            </button>
          ))}
        </div>
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

      {chosenAttributes[0] && (
        <>
          <br />
          <br />
          <br />
          <button className="stop" onClick={clearChosenAttributes}>
            Clear Chosen Attributes
          </button>
        </>
      )}
    </div>
  );
}

export default App;
