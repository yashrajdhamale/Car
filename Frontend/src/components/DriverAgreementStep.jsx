import React from 'react';
const DriverAgreementStep = ({
  register,
  errors,
  watch,
  companyName = 'Cab Route Services',
  companySignerName = '',
  companySignerDesignation = '',
  fullName = '',
}) => {
  const agreementDate = watch("agreementDate");

  const formattedAgreementDate = agreementDate
    ? new Date(agreementDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "____________";
  const agreementStartDate = watch("agreementStartDate");

  const agreementEndDate = agreementStartDate
    ? new Date(
        new Date(agreementStartDate).setDate(
          new Date(agreementStartDate).getDate() + 365
        )
      )
        .toISOString()
        .split("T")[0]
    : "";
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <h3 className="text-lg font-semibold text-blue-900">Step 2: Tourist Transport Service Agreement</h3>
        <p className="mt-1 text-sm text-blue-800">
          Driver must read the full agreement below and complete the required agreement fields before final submission.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agreement Details</h3>

        <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Agreement Date *
                </label>

                <input
                    type="date"
                    {...register("agreementDate", {
                        required: "Agreement date is required",
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />

                {errors.agreementDate && (
                    <p className="text-red-500 text-sm">
                        {errors.agreementDate.message}
                    </p>
                )}
            </div>
      </div>

      <div className="
        bg-white
        max-w-5xl
        mx-auto
        rounded-2xl
        shadow-2xl
        border
        border-gray-200
        p-16
        text-[15px]
        leading-8
        font-serif
        text-gray-800
        max-h-[900px]
        overflow-y-auto
        ">
        <h2 className="text-4xl font-bold tracking-wide text-center text-gray-900 mb-1">TOURIST TRANSPORT SERVICE AGREEMENT</h2>
        <p className="text-center italic text-gray-500 mb-8">(Between Tour Operator and Tourist Car Driver / Vehicle Provider)</p>

        <p>
          THIS AGREEMENT is made on 
            <strong>
            {formattedAgreementDate}
            </strong>
        </p>


        <div className="my-8">
          <h3 className="text-lg font-bold uppercase tracking-wide text-gray-900">
            BETWEEN
          </h3>

          <div className="mt-4 rounded-lg border border-gray-300 bg-gray-50 p-5 leading-8">
            <p className="text-lg font-bold">
              Cab Route Services
            </p>

            <p className="text-gray-700 mt-2">
              Office Number 304, 3rd Floor Goodwill Square, Dhanori,
              Pune, Maharashtra State, India – 411015
            </p>

            
            
            <p className="mt-3 italic text-gray-600">
              (Hereinafter referred to as the <strong>"Tour Operator"</strong>)
            </p>
          </div>
        </div>

        
              <p className="mt-8 text-lg font-bold uppercase tracking-wide">
        AND
      </p>

      <div className="mt-5 border border-gray-300 rounded-xl p-6 bg-gray-50 leading-9">

        <p>
          <strong>Driver / Vehicle Provider Name :</strong>{" "}
          <input
            type="text"
            {...register("driverName", {
              required: "Driver name is required",
            })}
            className="inline-block w-80 border-0 border-b-2 border-gray-500 bg-transparent outline-none focus:border-blue-600 px-2"
            placeholder="Enter Driver Name"
          />
        </p>

        {errors.driverName && (
          <p className="text-red-500 text-sm mt-1">
            {errors.driverName.message}
          </p>
        )}

        <p className="mt-4">
          <strong>Firm Name :</strong>{" "}
          <input
            type="text"
            {...register("firmName")}
            className="inline-block w-80 border-0 border-b-2 border-gray-500 bg-transparent outline-none focus:border-blue-600 px-2"
            placeholder="Firm Name (Optional)"
          />
        </p>

        <p className="mt-4">
          <strong>Address :</strong>
        </p>

        <textarea
          rows={3}
          {...register("agreementAddress", {
            required: "Address is required",
          })}
          className="mt-2 w-full rounded-lg border border-gray-300 p-3 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          placeholder="Enter Full Address"
        />

        {errors.agreementAddress && (
          <p className="text-red-500 text-sm mt-1">
            {errors.agreementAddress.message}
          </p>
        )}

        <p className="mt-5">
          <strong>Aadhaar Card Number :</strong>{" "}
          <input
            type="text"
            maxLength={12}
            {...register("aadhaarNumber", {
              required: "Aadhaar Number is required",
              pattern: {
                value: /^\d{12}$/,
                message: "Aadhaar must be exactly 12 digits",
              },
            })}
            className="inline-block w-72 border-0 border-b-2 border-gray-500 bg-transparent outline-none focus:border-blue-600 px-2"
            placeholder="123456789012"
          />
        </p>

        {errors.aadhaarNumber && (
          <p className="text-red-500 text-sm mt-1">
            {errors.aadhaarNumber.message}
          </p>
        )}

        <p className="mt-5">
          <strong>PAN Card Number :</strong>{" "}
          <input
            type="text"
            maxLength={10}
            {...register("panNumber", {
              required: "PAN Number is required",
              pattern: {
                value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i,
                message: "Invalid PAN Number",
              },
            })}
            className="inline-block w-60 border-0 border-b-2 border-gray-500 bg-transparent outline-none focus:border-blue-600 px-2 uppercase"
            placeholder="ABCDE1234F"
          />
        </p>

        {errors.panNumber && (
          <p className="text-red-500 text-sm mt-1">
            {errors.panNumber.message}
          </p>
        )}

        <div className="mt-6 italic text-gray-700">
          (Hereinafter referred to as the
          <strong> "Service Provider / Driver"</strong>)
        </div>


        <div className="my-8 border-t border-gray-300" />

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">
          1. PURPOSE
        </h3>
        <p>
          This Agreement defines the terms under which the Service Provider shall provide <strong>tourist vehicle services</strong> to customers assigned by <strong>Cab Route Services</strong>, ensuring <strong>maximum passenger safety, compliance, and service quality</strong>.
        </p>

        <div className="my-8 border-t border-gray-300" />

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">
          2. SCOPE OF SERVICES
        </h3>

        <p>The Service Provider agrees to:</p>

        <ul className="list-disc pl-8 space-y-2">
          <li>Provide <strong>well-maintained, legally registered tourist vehicles</strong></li>
          <li>Provide <strong>valid licensed driver(s)</strong></li>
          <li>Execute trips assigned by <strong>Cab Route Services</strong></li>
          <li>Follow itinerary, reporting, and coordination instructions</li>
        </ul>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">3. PASSENGER SAFETY OBLIGATIONS (MANDATORY)</h3>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">3.1 : Legal Compliance</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li>Valid <strong>Commercial Driving License</strong></li>
          <li>Vehicle must have:</li>
          <li>Tourist Permit</li>
          <li>Valid Insurance (Comprehensive)</li>
          <li>PUC Certificate</li>
          <li>Fitness Certificate</li>
          <li>Compliance with <strong>Motor Vehicles Act, India</strong></li>
        </ul>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">3.2 : Safe Driving Practices</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li>No over-speeding, rash driving, or negligence</li>
          <li>Strict prohibition of driving under:</li>
          <li>Alcohol</li>
          <li>Drugs</li>
          <li>Fatigue</li>
          <li>Maximum driving hours: 10--12 hours/day with rest breaks</li>
        </ul>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">3.3 : Passenger Protection</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li>Ensure:</li>
          <li>Seat belts are functional and used</li>
          <li>Clean and hygienic vehicle condition</li>
          <li>No harassment or misconduct</li>
          <li>No unauthorized passengers allowed</li>
        </ul>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">3.4 : Emergency Handling</h3>
        <p>Driver must:</p>
        <ul className="list-disc pl-8 space-y-2">
          <li>Carry emergency contact numbers</li>
          <li>Assist passengers in:</li>
          <li>Medical emergencies</li>
          <li>Accidents</li>
          <li>Breakdowns</li>
          <li>Inform <strong>Cab Route Services</strong> immediately</li>
        </ul>

        <div className="my-8 border-t border-gray-300" />

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">4. : DRIVER CONDUCT & BEHAVIOR</h3>
        <p>The driver shall:</p>
        <ul className="list-disc pl-8 space-y-2">
          <li>Be <strong>polite, professional, and respectful</strong></li>
          <li>Avoid arguments or misbehavior with passengers</li>
          <li>Not misguide or overcharge customers</li>
          <li>Maintain punctuality</li>
          <li>Follow dress code (if instructed by Cab Route Services)</li>
        </ul>

        <div className="my-8 border-t border-gray-300" />

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">5. : VEHICLE STANDARDS</h3>
        <p>Vehicle must:</p>
        <ul className="list-disc pl-8 space-y-2">
          <li>Be clean (interior & exterior)</li>
          <li>Be mechanically sound</li>
          <li>Have:</li>
          <li>First-aid kit</li>
          <li>Fire extinguisher (recommended)</li>
          <li>AC must be functional (if promised)</li>
        </ul>

        <div className="my-8 border-t border-gray-300" />
        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">
          6. PAYMENT TERMS
        </h3>

        <div className="space-y-5">

          <div>
            <label className="font-semibold">
              Payment Structure
            </label>

            <input
              type="text"
              {...register("paymentStructure", {
                required: "Payment Structure is required",
              })}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2"
              placeholder="Per Trip / Per KM / Per Day"
            />

            {errors.paymentStructure && (
              <p className="text-red-500 text-sm mt-1">
                {errors.paymentStructure.message}
              </p>
            )}
          </div>

          <div>
            <label className="font-semibold">
              Payment Cycle
            </label>

            <input
              type="text"
              {...register("paymentCycle", {
                required: "Payment Cycle is required",
              })}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2"
              placeholder="Weekly / Monthly / 7 Days"
            />

            {errors.paymentCycle && (
              <p className="text-red-500 text-sm mt-1">
                {errors.paymentCycle.message}
              </p>
            )}
          </div>

          <p className="mt-5">
            Cab Route Services reserves the right to deduct payment in case of customer complaints, delays, or service failures as per company policy.
          </p>

        </div>
        
        <ul className="list-disc pl-8 space-y-2">
          <li><strong>Cab Route Services</strong> reserves the right to deduct for:</li>
          <li>Customer complaints</li>
          <li>Delays</li>
          <li>Service failures</li>
        </ul>

        <div className="my-8 border-t border-gray-300" />

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">7. : LIABILITY & INDEMNITY</h3>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">7.1 : Driver Responsibility</h3>
        <p>The Service Provider is fully responsible for:</p>
        <ul className="list-disc pl-8 space-y-2">
          <li>Passenger safety during travel</li>
          <li>Any accident due to negligence</li>
          <li>Legal violations</li>
        </ul>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">7.2 : Indemnification</h3>
        <p>The Service Provider shall indemnify and hold harmless <strong>Cab Route Services</strong> from:</p>
        <ul className="list-disc pl-8 space-y-2">
          <li>Claims</li>
          <li>Losses</li>
          <li>Damages</li>
          <li>Legal actions arising from:</li>
          <li>Accidents</li>
          <li>Misconduct</li>
          <li>Safety violations</li>
        </ul>

        <div className="my-8 border-t border-gray-300" />

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">8. : INSURANCE</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li>Vehicle must have <strong>valid commercial insurance</strong></li>
          <li>Passenger insurance (if applicable)</li>
          <li>Driver responsible for claims and legal compliance</li>
        </ul>

        <div className="my-8 border-t border-gray-300" />

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">9. : PENALTIES & TERMINATION</h3>
        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">Immediate Termination if:</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li>Drunk driving</li>
          <li>Passenger safety violation</li>
          <li>Misconduct or harassment</li>
          <li>Fraud or document falsification</li>
        </ul>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">Penalties</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li>Financial penalties for:</li>
          <li>Delays</li>
          <li>Poor vehicle condition</li>
          <li>Non-compliance</li>
        </ul>

        <div className="my-8 border-t border-gray-300" />

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">10. : CONFIDENTIALITY</h3>
        <p>The Service Provider shall not:</p>
        <ul className="list-disc pl-8 space-y-2">
          <li>Share customer details</li>
          <li>Use customer data for personal business</li>
        </ul>

        <div className="my-8 border-t border-gray-300" />

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">11. : NON-SOLICITATION</h3>
        <p>The Service Provider shall not:</p>
        <ul className="list-disc pl-8 space-y-2">
          <li>Directly contact or solicit customers of <strong>Cab Route Services</strong></li>
          <li>Offer independent services to booked passengers</li>
        </ul>

        <div className="my-8 border-t border-gray-300" />

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">12. : DISPUTE RESOLUTION</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li>Jurisdiction: <strong>Pune, Maharashtra</strong></li>
          <li>Resolution method:</li>
          <li>Mutual discussion</li>
          <li>Arbitration (if required)</li>
        </ul>

        <div className="my-8 border-t border-gray-300" />

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">13. : FEMALE PASSENGER SAFETY PROTOCOL</h3>
        <p>The Service Provider / Driver agrees to strictly follow the below safety standards while transporting female passengers:</p>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">13.1 : Zero-Tolerance Conduct Policy</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li>Driver shall maintain strict professional behavior at all times</li>
          <li>Any form of:</li>
          <li>Harassment</li>
          <li>Misconduct</li>
          <li>Inappropriate conversation</li>
          <li>Staring, gestures, or comments will lead to immediate termination and legal action</li>
        </ul>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">13.2 : Identity & Verification</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li>Driver must:</li>
          <li>Share name, contact number, and vehicle number before trip (via Cab Route Services system)</li>
          <li>Carry valid ID proof and driving license</li>
          <li>Vehicle must match booking details exactly</li>
        </ul>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">13.3 : Trip Transparency</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li>Trip details must be:</li>
          <li>Pre-defined and followed strictly</li>
          <li>Not altered without approval from Cab Route Services</li>
          <li>Driver shall not:</li>
          <li>Take alternate routes without valid reason</li>
          <li>Stop at unauthorized locations</li>
        </ul>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">13.4 : Night Travel Safety (8:00 PM -- 6:00 AM)</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li>Mandatory compliance:</li>
          <li>Trip tracking (GPS or live location sharing)</li>
          <li>Regular check-ins (if instructed)</li>
          <li>Driver shall:</li>
          <li>Avoid isolated routes unless necessary</li>
          <li>Ensure safe drop exactly at passenger location</li>
        </ul>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">13.5 : No Personal Interaction Rule</h3>
        <p>Driver is strictly prohibited from:</p>
        <ul className="list-disc pl-8 space-y-2">
          <li>Asking personal questions</li>
          <li>Requesting phone numbers</li>
          <li>Sending messages or contacting passengers after trip</li>
          <li>Offering personal services outside Cab Route Services</li>
        </ul>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">13.6 : Emergency Response Protocol</h3>
        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">In case of emergency:</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li><strong>Driver must:</strong></li>
          <li>Immediately inform to Cab Route Services</li>
          <li>Assist passenger in reaching nearest safe location</li>
          <li>Cooperate with police or emergency services</li>
        </ul>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">13.7 : Vehicle Safety Requirements</h3>
        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">Vehicle must have:</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li>Functional central locking system</li>
          <li>Clean and well-lit interior</li>
          <li>Working mobile phone with sufficient battery</li>
          <li>GPS enabled device.</li>
        </ul>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">13.8 : Complaint & Escalation</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li>Any complaint from female passenger will be treated as high priority</li>
          <li>Immediate suspension of driver pending investigation</li>
          <li>Proven misconduct will result in:</li>
          <li>Permanent termination</li>
          <li>Blacklisting</li>
          <li>Legal action under applicable Indian laws</li>
        </ul>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">13.9 : Legal Compliance</h3>
        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">Driver agrees that any violation may attract action under:</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li>Indian Penal Code (IPC)</li>
          <li>Motor Vehicles Act</li>
          <li>Women Safety Laws in India</li>
        </ul>

        <div className="my-8 border-t border-gray-300" />

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">13.10 SOS button facility for safety.</h3>
        <p>
          <strong>Legal Requirement:</strong> Under Rule 125H of the Central Motor Vehicles Rules (CMVR) and Supreme Court directives, all public transport and tourist vehicles (except autorickshaws and e-rickshaws) must be equipped with AIS 140-compliant tracking devices and panic buttons.
        </p>
        <p>
          <strong>Vehicle Fitness:</strong> Vehicles lacking these functional, government-approved devices will be denied annual fitness certificates and transport permits.
        </p>
        <p>
          <strong>Emergency Response:</strong> Pressing the button immediately alerts the designated Emergency Response Centre (ERC). Local authorities or state control rooms can track the cab's route, speed, and exact location to dispatch help or intercept the vehicle.
        </p>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">Declaration by Driver</h3>
        <p>
          <strong>"I hereby confirm that I understand and will strictly follow all female passenger safety rules laid down by Cab Route Services. Any violation will be my sole responsibility."</strong>
        </p>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">Driver Name: {watch("driverName") || '_________________________'}</h3>
        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">Aadhar Card Number : {watch('aadhaarNumber') || '_________________________'}</h3>
        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">Pan Card Number : {watch('panNumber') || '_________________________'}</h3>
        <div className="mt-12">
          <div className="w-56 border-t border-black pt-2">
            Driver Signature
          </div>
        </div>
        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">
          13. AGREEMENT VALIDITY
          </h3>

          <div className="rounded-lg border bg-gray-50 p-6">

          <div className="grid grid-cols-2 gap-5">

          <div>

          <label className="font-semibold">
          Agreement Start Date
          </label>

          <input
          type="date"
          {...register("agreementStartDate",{
          required:"Agreement Start Date is required"
          })}
          className="mt-2 w-full rounded-lg border p-2"
          />

          </div>

          <div>

          <label className="font-semibold">
          Agreement End Date
          </label>

          <input
          type="date"
          value={agreementEndDate}
          readOnly
          className="mt-2 w-full rounded-lg border bg-gray-100 p-2"
          />

          </div>

          </div>

          <p className="mt-5">
          This agreement shall remain valid for
          <strong>365 days</strong>
          from the Agreement Start Date unless terminated earlier.
          </p>

          </div>

        <div className="my-8 border-t border-gray-300" />

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">14. DECLARATION</h3>
        <p>Both parties agree to comply with all terms, especially <strong>passenger safety and legal obligations</strong>.</p>

        <div className="my-8 border-t border-gray-300" />

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">SIGNATURES</h3>

        <h3 className="mt-10 mb-4 border-b border-gray-300 pb-2 text-xl font-bold text-blue-900">For Cab Route Services</h3>
        <p>Name: {companySignerName || '____________________________'}</p>
        <p>Designation: {companySignerDesignation || '____________________________'}</p>
        <div className="mt-12">
          <div className="w-56 border-t border-black pt-2">
            Authorized Signature
          </div>
        </div>
        <p className="mt-6">
          Company Seal
          </p>

          <div className="mt-2 h-20 w-44 rounded-lg border border-dashed border-gray-400 flex items-center justify-center text-gray-400">
            Company Stamp
          </div>

        <p className="mt-6">
            <strong>Service Provider / Driver</strong>
        </p>

        <div className="mt-4">

        <label className="block font-semibold mb-2">
        Digital Signature
        </label>

        <div className="mt-8">
          <label className="block font-semibold mb-2">
            Upload Signature *
          </label>

          <input
            type="file"
            accept="image/*,.png,.jpg,.jpeg"
            onChange={(e) =>
              setSignatureFile(e.target.files?.[0] || null)
            }
            className="block w-full border border-gray-300 rounded-lg p-3"
          />

          <p className="text-xs text-gray-500 mt-2">
            Upload your handwritten signature image.
          </p>
        </div>

        {errors.driverSignatureName && (
        <p className="text-red-500 text-sm mt-1">
        {errors.driverSignatureName.message}
        </p>
        )}

        </div>


        <p>
        Aadhaar :
        {watch("aadhaarNumber") || "___________________"}
        </p>

        <p>
        PAN :
        {watch("panNumber") || "___________________"}
        </p>

        <div className="mt-12">
        <div className="w-56 border-t border-black pt-2">
        Driver Signature
        </div>
        </div>
      </div>

    </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Declarations</h3>

        <div className="space-y-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              {...register('declarationAccepted', {
                required: 'You must accept the main declaration',
              })}
              className="mt-1"
            />
            <span className="text-sm text-gray-700">
              I agree that I will comply with all service, conduct, passenger safety, and legal obligations under this agreement.
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              {...register('femaleSafetyAccepted', {
                required: 'Female passenger safety acceptance is required',
              })}
              className="mt-1"
            />
            <span className="text-sm text-gray-700">
              I understand and will strictly follow all female passenger safety rules laid down by {companyName}.
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              {...register('noSolicitationAccepted')}
              className="mt-1"
            />
            <span className="text-sm text-gray-700">
              I will not directly solicit or contact customers outside the Cab Route Services system.
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              {...register('legalComplianceAccepted', {
                required: 'Legal compliance acceptance is required',
              })}
              className="mt-1"
            />
            <span className="text-sm text-gray-700">
              I confirm that my vehicle and driving credentials comply with applicable transport and safety rules.
            </span>
          </label>
        </div>
      </div>

      

    </div>
  );
};

export default DriverAgreementStep;