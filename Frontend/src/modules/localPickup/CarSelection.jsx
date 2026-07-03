// import React from "react";
// import carsConfig from "./config/carsConfig.json";

// const CarSelection = ({ onCarSelect, selectedCar, disabled = false, distance = 0 }) => {
//   const categories = carsConfig.carCategories;

//   const calculatePrice = (category) => {
//     if (!distance) return null;
//     // Fixed calculation: baseFare + (distance × perKmRate)
//     const { baseFare, perKmRate } = category.pricing;
//     return Math.round(baseFare + (distance * perKmRate));
//   };

//   const styles = {
//     container: {
//       marginTop: "1.5rem",
//       background: "#fff",
//       borderRadius: "12px",
//       border: "1px solid #eee",
//       overflow: "hidden"
//     },
//     header: {
//       padding: "1rem",
//       fontSize: "1.1rem",
//       fontWeight: 700,
//       borderBottom: "1px solid #eee"
//     },
//     list: {
//       maxHeight: "420px", // ~5 rows
//       overflowY: "auto"
//     },
//     row: (selected) => ({
//       display: "flex",
//       alignItems: "center",
//       padding: "1rem",
//       cursor: disabled ? "not-allowed" : "pointer",
//       backgroundColor: selected ? "#fff3e0" : "#fff",
//       borderBottom: "1px solid #f1f1f1",
//       transition: "0.2s",
//       "&:hover": {
//         backgroundColor: "#f9f9f9"
//       }
//     }),
//     image: {
//       width: "120px",
//       height: "75px",
//       objectFit: "cover",
//       marginRight: "1rem",
//       borderRadius: "6px"
//     },
//     details: {
//       flex: 1
//     },
//     categoryName: {
//       fontSize: "1rem",
//       fontWeight: 700,
//       color: "#ff6d00"
//     },
//     marketCars: {
//       fontSize: "0.8rem",
//       color: "#666",
//       marginTop: "0.25rem"
//     },
//     priceBox: {
//       textAlign: "right",
//       minWidth: "100px"
//     },
//     price: {
//       fontSize: "1.1rem",
//       fontWeight: 700,
//       color: "#ff6d00"
//     },
//     rate: {
//       fontSize: "0.75rem",
//       color: "#888",
//       marginTop: "0.25rem"
//     },
//     selectedTag: {
//       fontSize: "0.75rem",
//       marginTop: "0.3rem",
//       color: "#ff6d00",
//       fontWeight: 600
//     },
//     distanceInfo: {
//       fontSize: "0.8rem",
//       color: "#777",
//       marginTop: "0.25rem"
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <div style={styles.header}>
//         Select your ride
//         <div style={styles.distanceInfo}>
//           {distance > 0 ? `For ${distance.toFixed(1)} km trip` : "Estimated fares"}
//         </div>
//       </div>

//       <div style={styles.list}>
//         {categories.map(category => {
//           const selected = selectedCar?.id === category.id;
//           const price = calculatePrice(category);
          
//           // Add hover style for non-disabled, non-selected rows
//           const rowStyle = {
//             ...styles.row(selected),
//             ...(!disabled && !selected && {
//               ":hover": {
//                 backgroundColor: "#f9f9f9"
//               }
//             })
//           };

//           return (
//             <div
//               key={category.id}
//               style={rowStyle}
//               onClick={() => !disabled && onCarSelect({
//                 id: category.id,
//                 name: category.name,
//                 category: category.name,
//                 baseFare: category.pricing.baseFare,
//                 perKmRate: category.pricing.perKmRate,
//                 description: category.description
//               })}
//             >
//               {/* LEFT IMAGE */}
//               <img
//                 src={category.imageUrl}
//                 alt={category.name}
//                 style={styles.image}
//               />

//               {/* DETAILS */}
//               <div style={styles.details}>
//                 <div style={styles.categoryName}>
//                   {category.name}
//                 </div>

//                 <div style={styles.marketCars}>
//                   {category.description}
//                 </div>
                
//                 <div style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.25rem" }}>
//                   Includes: {category.marketCars.join(", ")}
//                 </div>

//                 {selected && (
//                   <div style={styles.selectedTag}>✓ Selected</div>
//                 )}
//               </div>

//               {/* PRICE */}
//               <div style={styles.priceBox}>
//                 {price && <div style={styles.price}>₹{price}</div>}
//                 <div style={styles.rate}>
//                   ₹{category.pricing.perKmRate}/km
//                 </div>
//                 <div style={{ fontSize: "0.7rem", color: "#999", marginTop: "0.1rem" }}>
//                   Base: ₹{category.pricing.baseFare}
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default CarSelection;


import React from "react";
import carsConfig from "./config/carsConfig.json";

const PER_KM_RATE = 12;
const GST_PERCENT = 5;

const CarSelection = ({ onCarSelect, selectedCar, disabled = false, distance = 0 }) => {
  const categories = carsConfig.carCategories;

  const calculatePrice = () => {
    if (!distance) return null;
    const base = distance * PER_KM_RATE;
    const gst  = (base * GST_PERCENT) / 100;
    return Math.round(base + gst);
  };

  const styles = {
    container: {
      marginTop: "1.5rem",
      background: "#fff",
      borderRadius: "12px",
      border: "1px solid #eee",
      overflow: "hidden"
    },
    header: {
      padding: "1rem",
      fontSize: "1.1rem",
      fontWeight: 700,
      borderBottom: "1px solid #eee"
    },
    list: {
      maxHeight: "420px",
      overflowY: "auto"
    },
    row: (selected) => ({
      display: "flex",
      alignItems: "center",
      padding: "1rem",
      cursor: disabled ? "not-allowed" : "pointer",
      backgroundColor: selected ? "#fff3e0" : "#fff",
      borderBottom: "1px solid #f1f1f1",
      transition: "0.2s"
    }),
    image: {
      width: "120px",
      height: "75px",
      objectFit: "cover",
      marginRight: "1rem",
      borderRadius: "6px"
    },
    details: {
      flex: 1
    },
    categoryName: {
      fontSize: "1rem",
      fontWeight: 700,
      color: "#ff6d00"
    },
    marketCars: {
      fontSize: "0.8rem",
      color: "#666",
      marginTop: "0.25rem"
    },
    priceBox: {
      textAlign: "right",
      minWidth: "100px"
    },
    price: {
      fontSize: "1.1rem",
      fontWeight: 700,
      color: "#ff6d00"
    },
    rate: {
      fontSize: "0.75rem",
      color: "#888",
      marginTop: "0.25rem"
    },
    selectedTag: {
      fontSize: "0.75rem",
      marginTop: "0.3rem",
      color: "#ff6d00",
      fontWeight: 600
    },
    distanceInfo: {
      fontSize: "0.8rem",
      color: "#777",
      marginTop: "0.25rem"
    }
  };

  const price = calculatePrice();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        Select your ride
        <div style={styles.distanceInfo}>
          {distance > 0 ? `For ${distance.toFixed(1)} km trip` : "Estimated fares"}
        </div>
      </div>

      <div style={styles.list}>
        {categories.map(category => {
          const selected = selectedCar?.id === category.id;

          return (
            <div
              key={category.id}
              style={styles.row(selected)}
              onClick={() => !disabled && onCarSelect({
                id: category.id,
                name: category.name,
                category: category.name,
                baseFare: 0,
                perKmRate: PER_KM_RATE,
                description: category.description
              })}
            >
              {/* LEFT IMAGE */}
              <img
                src={category.imageUrl}
                alt={category.name}
                style={styles.image}
              />

              {/* DETAILS */}
              <div style={styles.details}>
                <div style={styles.categoryName}>
                  {category.name}
                </div>

                <div style={styles.marketCars}>
                  {category.description}
                </div>

                <div style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.25rem" }}>
                  Includes: {category.marketCars.join(", ")}
                </div>

                {selected && (
                  <div style={styles.selectedTag}>✓ Selected</div>
                )}
              </div>

              {/* PRICE */}
              <div style={styles.priceBox}>
                {price && <div style={styles.price}>₹{price}</div>}
                <div style={styles.rate}>
                  ₹{PER_KM_RATE}/km
                </div>
                <div style={{ fontSize: "0.7rem", color: "#999", marginTop: "0.1rem" }}>
                  +{GST_PERCENT}% GST incl.
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CarSelection;