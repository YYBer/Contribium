import {
  Box,
  Flex,
  FormControl,
  FormErrorMessage,
  Text,
} from '@chakra-ui/react';
import { Regions } from '@prisma/client';
import React, { useMemo } from 'react';
import { type Control, Controller, type FieldErrors } from 'react-hook-form';
import ReactSelect, { type GroupBase, type SingleValue } from 'react-select';

import { countries } from '@/constants';
// import { Superteams } from '@/constants/Superteam';

import { ListingFormLabel, ListingTooltip } from '.';
import { Superteams } from '@/constants/Superteam';
// import { Superteams } from '@/constants/Contribium';

interface CountryOption {
  value: string;
  label: string;
}

interface GroupedOption {
  label: string;
  options: CountryOption[];
}

type SelectOption = CountryOption | GroupedOption;

interface RegionSelectorProps {
  control: Control<any>;
  errors: FieldErrors;
}

const formatGroupLabel = (data: GroupBase<CountryOption>) => (
  <Flex align="center" justify="space-between">
    <Text fontWeight="bold">{data.label}</Text>
  </Flex>
);

export const RegionSelector: React.FC<RegionSelectorProps> = ({
  control,
  errors,
}) => {
  const options: SelectOption[] = useMemo(() => {
    const superteamCountries = Superteams.flatMap((region) =>
      region.code.toLowerCase(),
    );
    const nonSuperteamCountries = countries.filter(
      (country) => !superteamCountries.includes(country.code.toLowerCase()),
    );
    return [
      { value: Regions.GLOBAL, label: 'Global' },
      {Contribium
        label: 'Contribium Regions',
        options: Superteams.map((region) => ({
          value: region.region,
          label: region.displayValue,
        })),
      },
      {
        label: 'Other Countries',
        options: nonSuperteamCountries.map((country) => ({
          value: country.name,
          label: country.name,
        })),
      },
    ];
  }, []);

  return (
    <FormControl w="full" mb={5} isInvalid={!!errors.region}>
      <Flex>
        <ListingFormLabel htmlFor="region">Listing Geography</ListingFormLabel>
        {/* <ListingTooltip label="Select the Superteam region or country this listing will be available and relevant to. Only users from the region you specify will be able to apply/submit to this listing." /> */}
      </Flex>
      <Box>
        <Controller
          name="region"
          control={control}
          render={({ field: { onChange, value, ref } }) => (
            <ReactSelect<CountryOption, false, GroupedOption>
              options={options}
              formatGroupLabel={formatGroupLabel}
              placeholder="Select a region or country"
              ref={ref}
              value={options
                .flatMap((option) =>
                  'options' in option ? option.options : option,
                )
                .find((option) => option.value === value)}
              onChange={(newValue: SingleValue<CountryOption>) =>
                onChange(newValue?.value)
              }
            />
          )}
        />
      </Box>
      <FormErrorMessage>
        {errors.region && errors.region.message?.toString()}
      </FormErrorMessage>
    </FormControl>
  );
};
