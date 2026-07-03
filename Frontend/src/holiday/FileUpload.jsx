import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

const extractItinerary = (text) => {
    const headingPattern = /Day \d+[^:]*: [^\n]+/g;
    const descriptionPattern = /(?<=:)[^:]*?(?=(Day \d+|$|Tour End))/gs;

    const headings = text.match(headingPattern) || [];
    let descriptions = text.match(descriptionPattern) || [];

    // Clean descriptions: remove extra new lines and spaces, then filter out empty descriptions
    const cleanedDescriptions = descriptions
        .map(description => description.replace(/\n+/g, ' ').trim())
        .filter(description => description.length > 0);

    // Filter out empty headings
    const cleanedHeadings = headings.filter(heading => heading !== '');

    return {
        cleanedHeadings,
        cleanedDescriptions
    };
};

const FileUpload = () => {
    const { register, handleSubmit } = useForm();
    const [inputText, setInputText] = useState('');
    const [itinerary, setItinerary] = useState({ cleanedHeadings: [], cleanedDescriptions: [] });

    const onSubmit = (data) => {
        const result = extractItinerary(data.itineraryText);
        setItinerary(result);
    };

    const handleDescriptionChange = (index, value) => {
        const updatedDescriptions = [...itinerary.cleanedDescriptions];
        updatedDescriptions[index] = value;
        setItinerary({ ...itinerary, cleanedDescriptions: updatedDescriptions });
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Itinerary Extractor</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
                <textarea
                    {...register('itineraryText')}
                    className="w-full p-2 border border-gray-300 rounded mb-4"
                    rows="10"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste the itinerary text here..."
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Extract Itinerary
                </button>
            </form>

            {itinerary.cleanedHeadings.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-xl font-bold mb-4">Extracted Itinerary</h2>
                    <table className="min-w-full border border-gray-300">
                        <thead>
                            <tr>
                                <th className="border border-gray-300 px-4 py-2">Heading</th>
                                <th className="border border-gray-300 px-4 py-2">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itinerary.cleanedHeadings.map((heading, index) => (
                                <tr key={index}>
                                    <td className="w-1/4 border border-gray-300 px-4 py-2">
                                        <textarea
                                            {...register(`headings.${index}`)}
                                            defaultValue={heading}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                                            placeholder="Heading"
                                            wrap="soft"
                                        />
                                    </td>
                                    <td className="w-3/4 border border-gray-300 px-4 py-2">
                                        <textarea
                                            value={itinerary.cleanedDescriptions[index]}
                                            rows="4"
                                            onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                                            placeholder="Description"
                                            wrap="soft"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
