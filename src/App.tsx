/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
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
  const apiUrl = "http://localhost:3000/product/1312/variations";
  const [coverTypes, setCoverTypes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [boxes, setBoxes] = useState<string[]>([]);
  const [parsedVariations, setParsedVariations] = useState<IVariation[]>([]);
  const [chosenAttributes, setChosenAttributes] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);

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

  const fetchVariations = async () => {
    try {
      const response = await axios.get(apiUrl);
      const variations = parseVariations(response.data.data);

      const uniqueCoverTypes = variations
        .map((variation) => {
          return (
            variation.attributes.find(
              (attribute) => attribute.type === "covertype"
            )?.value || ""
          );
        })
        .filter((value, index, self) => self.indexOf(value) === index);

      setCoverTypes(uniqueCoverTypes);
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

      setColors(uniqueColors);
      setBoxes([]);
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

      setBoxes(uniqueBoxes);
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
    setColors([]);
    setBoxes([]);
  };

  useEffect(() => {
    fetchVariations();
  }, []);

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
        gap: "20px",
      }}
    >
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

      {chosenAttributes[0] && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "10px",
          }}
        >
          {colors.map((color, i) => (
            <button key={i} onClick={() => handleClick(color, "color")}>
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
            <button key={i} onClick={() => handleClick(box, "box")}>
              {box}
            </button>
          ))}
        </div>
      )}

      {chosenVariation && <h3>Chosen Variation Id: {chosenVariation.id}</h3>}

      {chosenAttributes[0] && (
        <button onClick={clearChosenAttributes}>Clear Chosen Attributes</button>
      )}
    </div>
  );
}

export default App;
