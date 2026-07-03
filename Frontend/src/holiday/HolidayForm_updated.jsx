const onSubmit = async (data) => {
    try {
        const fileInput1 = document.querySelector('#PaymentID');
        const fileInput2 = document.querySelector('#govID');
        const hasFile1 = fileInput1.files.length > 0;
        const hasFile2 = fileInput2.files.length > 0;

        // Scroll to show loading state
        setTimeout(() => {
            window.scrollTo({
                top: window.innerHeight / 1.2,
                behavior: 'smooth'
            });
        }, 100);

        if (!hasFile1 && !hasFile2) {
            alert("Please select a file to upload.");
            return false;
        }

        if (datePick == null) {
            alert("Please select a PickUp Date.");
            return false;
        }

        setButtonContent("Submitting Details and Finding Available Drivers...");

        // 1. First upload the files
        const randomName = generateRandomName();
        const DocumentProof = `user_documents/image_${randomName}`;
        const downloadURL = await uploadImageToFirebaseStorage(fileUploadUrl, DocumentProof);
        
        const randomNamePayment = generateRandomName();
        const PaymentProof = `user_payment/image_${randomNamePayment}`;
        const downloadURLPayment = await uploadImageToFirebaseStorage(fileUploadUrlPayment, PaymentProof);

        // 2. Prepare the booking data
        const formData = {
            ...data,
            DocumentProofUrl: downloadURL,
            PaymentProof: downloadURLPayment,
            PickUpDate: datePick,
            DropUpDate: dateDrop,
            GuestCountData: GuestCount,
            LocationData: selectLocationData,
            apporval: "pending",
            BookedDate: formattedDate,
            RegNumber1: generateRegName(selectLocationData.package_name),
            OnRequest: ShowCutoff,
            state: selectLocationData.state,
            bookingType: 'holiday',
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        console.log('Booking data prepared:', formData);

        // 3. Find available drivers for the selected state
        const state = selectLocationData.state;
        console.log(`🔍 Looking for drivers in state: ${state}`);
        
        const driverIds = await findDriversForHoliday(state);
        
        if (!driverIds || driverIds.length === 0) {
            console.error('❌ No available drivers found for the selected state');
            // Save the booking anyway, but mark it as needing manual assignment
            formData.driverStatus = 'needs_manual_assignment';
            
            const docRef = await addDoc(collection(db, 'bookings'), formData);
            console.log('Booking created with manual assignment needed:', docRef.id);
            
            // Show success but notify admin about the need for manual assignment
            alert('Your booking has been received, but we need to manually assign a driver. We\'ll contact you shortly.');
            
            let send_Data = {
                selectLocationData: selectLocationData,
                formData: formData,
            };
            
            navigate('/pdf', { 
                state: { 
                    send_Data, 
                    flag: "1",
                    bookingId: docRef.id,
                    status: 'pending_manual_assignment'
                } 
            });
            return;
        }

        console.log(`✅ Found ${driverIds.length} available drivers for ${state}`);
        
        // 4. Create the booking document
        const docRef = await addDoc(collection(db, 'bookings'), formData);
        console.log('✅ Booking created with ID:', docRef.id);
        
        // 5. Send ride requests to available drivers
        try {
            const bookingId = await sendHolidayRideRequests({
                ...formData,
                bookingId: docRef.id,
                state: state
            }, driverIds);
            
            console.log('✅ Ride requests sent to drivers for booking:', bookingId);
            
            // Prepare data for the confirmation page
            let send_Data = {
                selectLocationData: selectLocationData,
                formData: formData,
            };

            // Navigate to confirmation page
            navigate('/pdf', { 
                state: { 
                    send_Data, 
                    flag: "1",
                    bookingId: docRef.id,
                    status: 'pending_driver_confirmation'
                } 
            });
            
        } catch (error) {
            console.error('❌ Error sending ride requests:', error);
            // Update booking with error status
            await updateDoc(doc(db, 'bookings', docRef.id), {
                status: 'error',
                error: error.message,
                updatedAt: serverTimestamp()
            });
            
            // Still navigate to confirmation but with error status
            let send_Data = {
                selectLocationData: selectLocationData,
                formData: formData,
            };
            
            navigate('/pdf', { 
                state: { 
                    send_Data, 
                    flag: "1",
                    bookingId: docRef.id,
                    status: 'error',
                    message: 'Your booking was received, but there was an error assigning a driver. We\'ll contact you shortly.'
                } 
            });
        }

    } catch (error) {
        console.error("Error in form submission: ", error);
        setButtonContent("Submit Details"); // Reset button text
        alert('An error occurred while processing your booking. Please try again or contact support.');
    }
};