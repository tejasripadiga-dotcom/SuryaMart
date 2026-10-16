const requestId = "32157fb2-625b-4e49-ac90-245cad9c7aa9";

const orderData = {
  requestId: requestId,
  customer: {
  name: "Test Customer",
  mobile: "9876543210",
  email: "test@example.com",
  houseNumber: "10-1",
  street: "Main Road",
  city: "Warangal",
  state: "Telangana",
  pincode: "506001",
},
  items: [
    {
      productId: 3,
      quantity: 1,
      size: "M",
      color: "Black",
    },
  ],
};

async function testDuplicateOrder() {
  for (let i = 1; i <= 2; i++) {
    try {
      const response = await fetch(
        "http://localhost:5000/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        }
      );

      const data = await response.json();

      console.log(`Request ${i}:`, response.status);
      console.log(data);
    } catch (error) {
      console.log("Error:", error.message);
    }
  }
}

testDuplicateOrder();