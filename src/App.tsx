/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

interface IAttribute {
  id: string;
  type: string;
  value: string;
}

interface IVariation {
  id: string;
  attributes: IAttribute[];
}

interface IAttributeChoices {
  id: string;
  type: string;
  allValues: string[];
  availableValues: string[];
}

interface IAttributeChoicesResponseEntity {
  id: string;
  name: string;
  option: string;
}

// TOD0: change to http when running on local
const BASE_API_URL = "https://personalise.storyverseland.com/api";

function App() {
  const [productId, setProductId] = useState<string>("");
  const [remoteId, setRemoteId] = useState<string>("");
  const [variations, setVariations] = useState<IVariation[]>([]);
  const [noVariations, setNoVariations] = useState<boolean>(false);
  const [attributeChoices, setAttributeChoices] = useState<IAttributeChoices[]>(
    []
  );
  const [chosenAttributes, setChosenAttributes] = useState<string[]>([]);
  const [chosenVariation, setChosenVariation] = useState<
    IVariation | undefined
  >(undefined);

  const [chosenAttributeResponse, setChosenAttributeResponse] = useState<
    IAttributeChoicesResponseEntity[]
  >([]);

  const [producrRedirectUrl, setProductRedirectUrl] = useState<string>("");

  const parseVariations = (variations: IVariation[]) => {
    return variations.map((variation: IVariation) => {
      return {
        id: variation.id,
        attributes: variation.attributes.map((attribute: any) => {
          const parsedAttribute: IAttribute = {
            id: attribute.id,
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
            id: attribute.id,
            type: attribute.type,
            allValues: [attribute.value],
            availableValues: [],
          });
        }
      });
    });
    return attributeChoices;
  };

  const fetchProductId = async () => {
    const apiUrl = `${BASE_API_URL}/product/remote/${remoteId}`;
    const response = await axios.get(apiUrl);

    if (response.status !== 200) {
      return;
    }

    const productId = response.data.data.id;
    setProductId(productId);
  };

  const fetchVariations = async () => {
    try {
      const apiUrl = `${BASE_API_URL}/product/${productId}/variations`;
      const response = await axios.get(apiUrl);
      const _variations = parseVariations(response.data.data);
      const _attributeChoices = getAttributeChoices(_variations);

      if (_variations.length === 0) {
        setNoVariations(true);
        return;
      }

      setNoVariations(false);
      setVariations(_variations);
      setAttributeChoices(_attributeChoices);
      setChosenAttributes([]);
      setChosenVariation(undefined);
    } catch (error) {
      console.error(error);
    }
  };

  // get remote id and product id from url
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const remoteId = urlParams.get("remoteId");

    if (remoteId) {
      setRemoteId(remoteId);
    }
  }, []);

  useEffect(() => {
    if (remoteId) {
      fetchProductId();
    }
  }, [remoteId]);

  useEffect(() => {
    if (productId) {
      fetchVariations();
    }
  }, [productId]);

  const handleClick = (
    attribute: string,
    attributeIndex: number,
    attributeType: string
  ) => {
    const newChosenAttributes = chosenAttributes.slice(0, attributeIndex);

    const variationsWithChosenAttribute = variations.filter((variation) => {
      const checkForCurrentAttribute =
        variation.attributes.find(
          (attribute) => attribute.type === attributeType
        )?.value === attribute;

      if (newChosenAttributes.length) {
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
      setChosenAttributes([...newChosenAttributes, attribute]);
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

    const updatedChosenAttributes = newChosenAttributes.slice(
      0,
      attributeIndex
    );
    updatedChosenAttributes.push(attribute);

    setAttributeChoices(updatedAttributeChoices);
    setChosenAttributes(updatedChosenAttributes);
  };

  const createChosenAttributeResponse = () => {
    const attributeResponse: IAttributeChoicesResponseEntity[] =
      chosenAttributes.map((attribute) => {
        const att = attributeChoices.find((attributeChoice) =>
          attributeChoice.allValues.includes(attribute)
        );

        if (att) {
          return {
            id: att.id,
            name: att.type,
            option: attribute,
          };
        }

        return {
          id: "",
          name: "",
          option: "",
        };
      });

    setChosenAttributeResponse(attributeResponse);
  };

  const getVariationIdOfChosenAttributes = () => {
    const variation = variations.find((variation) => {
      return variation.attributes.every((attribute, index) => {
        return attribute.value === chosenAttributes[index];
      });
    });

    setChosenVariation(variation);
  };

  const createCustomization = async (variationId: string) => {
    const apiUrl = `${BASE_API_URL}/customization/generate/${variationId}`;
    const response = await axios.get(apiUrl, {
      params: {
        redirect: false,
      },
    });

    if (response.status !== 200) {
      return;
    }

    const customizationurl = response.data.url as string;
    const customizationId = customizationurl.split("/").pop();

    console.log(customizationId);

    const updateUrl = `${BASE_API_URL}/customization/${customizationId}`;

    const updateResp = await axios.patch(updateUrl, {
      sessionId: customizationId,
      customizationMetadata: {},
      variantId: chosenVariation?.id,
      attributeData: chosenAttributeResponse,
    });

    if (updateResp.status !== 200) {
      return;
    }

    const completeUrl = `${BASE_API_URL}/customization/${customizationId}/complete`;

    const completeResp = await axios.post(completeUrl, {
      sessionId: customizationId,
    });

    if (completeResp.status !== 201) {
      return;
    }

    const addUrl = completeResp.data.data;
    setProductRedirectUrl(addUrl);
  };

  useEffect(() => {
    if (chosenAttributes.length === attributeChoices.length) {
      getVariationIdOfChosenAttributes();
      createChosenAttributeResponse();
    }
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
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <p>Product Id: </p>
          <h5>{productId}</h5>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <p>Remote Id: </p>
          <h2>{remoteId}</h2>
        </div>
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
                    className={`${
                      chosenAttributes.includes(attributeValue)
                        ? "selected"
                        : ""
                    }`}
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
          <br />
          <button
            className="submit"
            onClick={() => {
              createCustomization(remoteId);
            }}
          >
            Generate Customization
          </button>
          {producrRedirectUrl && (
            <button
              className="submit"
              onClick={() => {
                window.open(producrRedirectUrl, "_blank");
              }}
            >
              Add Product to Cart
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
